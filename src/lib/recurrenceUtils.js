import { 
  addDays, addWeeks, addMonths, nextDay, setDate, isAfter, 
  isSameDay, getDaysInMonth, endOfMonth, startOfDay, 
  parseISO, format, getDay, getWeekOfMonth, setDay, 
  startOfMonth, addYears, differenceInCalendarDays
} from "date-fns";
import { Timestamp, doc, runTransaction, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Returns the next due date for a recurring task based on its config.
 * Uses date-fns for timezone-safe arithmetic.
 * 
 * @param {Object} recurrence The recurrence config object
 * @param {String} currentDueDate "YYYY-MM-DD"
 * @returns {String} "YYYY-MM-DD" format of next due date
 */
export function calculateNextDueDate(recurrence, currentDueDate) {
  const currentDate = startOfDay(parseISO(currentDueDate));
  let nextDate = currentDate;

  if (recurrence.type === "daily") {
    nextDate = addDays(currentDate, recurrence.interval || 1);
  } else if (recurrence.type === "weekly") {
    const selectedDays = recurrence.daysOfWeek || []; // [0,1,2,3,4,5,6] (0=Sun)
    if (selectedDays.length === 0) {
      nextDate = addDays(currentDate, 7 * (recurrence.interval || 1));
    } else {
      const sortedDays = [...selectedDays].sort();
      const currentDayOfWeek = currentDate.getDay();
      
      // Find the next selected day in the same week
      let nextDayNum = sortedDays.find(d => d > currentDayOfWeek);
      
      if (nextDayNum !== undefined) {
        nextDate = nextDay(currentDate, nextDayNum);
      } else {
        // Jump to the next week (with interval) and pick the first selected day
        const weekJump = recurrence.interval || 1;
        const startOfNextWeek = addWeeks(currentDate, weekJump);
        // nextDay with a specific day number finds the next occurrence of that day
        // We want the first selected day in that week.
        // If we just use nextDay(startOfNextWeek, sortedDays[0]), it might jump too far
        // if startOfNextWeek's day is already past sortedDays[0].
        // Let's find the start of the week first.
        const diff = (currentDayOfWeek + 7 - sortedDays[0]) % 7;
        const daysToFirstSelectedDay = 7 - diff;
        nextDate = addDays(currentDate, daysToFirstSelectedDay + (weekJump - 1) * 7);
      }
    }
  } else if (recurrence.type === "monthly") {
    const interval = recurrence.interval || 1;
    if (recurrence.monthlyMode === "weekday") {
      // e.g. "3rd Monday"
      const dayOfWeek = getDay(currentDate);
      const weekOfMonth = getWeekOfMonth(currentDate);
      
      let nextMonth = addMonths(currentDate, interval);
      let targetDate = startOfMonth(nextMonth);
      
      // Find the Nth occurrence of dayOfWeek in nextMonth
      let count = 0;
      let d = targetDate;
      while (count < weekOfMonth) {
        if (getDay(d) === dayOfWeek) {
          count++;
          if (count === weekOfMonth) {
            targetDate = d;
            break;
          }
        }
        d = addDays(d, 1);
        // If we overshoot the month, fallback to the last occurrence of that day in that month
        if (d.getMonth() !== nextMonth.getMonth()) {
          // Find the last occurrence
          let lastD = endOfMonth(nextMonth);
          while (getDay(lastD) !== dayOfWeek) {
            lastD = addDays(lastD, -1);
          }
          targetDate = lastD;
          break;
        }
      }
      nextDate = targetDate;
    } else {
      // Same date (e.g. 15th)
      nextDate = addMonths(currentDate, interval);
      // date-fns addMonths already handles Feb 30 -> Feb 28/29
    }
  } else if (recurrence.type === "custom") {
    nextDate = addDays(currentDate, recurrence.interval || 1);
  }

  return format(nextDate, "yyyy-MM-dd");
}

/**
 * Handles completing or skipping a recurring task.
 * 
 * @param {String} taskId The ID of the task instance being completed/skipped
 * @param {String} action "complete" | "skip"
 * @returns {Promise<Object>} Results including newTaskId and nextDueStr
 */
export async function handleRecurringTaskAction(taskId, action) {
  try {
    let result = { newTaskId: null, nextDueStr: null, seriesEnded: false };
    
    await runTransaction(db, async (transaction) => {
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await transaction.get(taskRef);
      
      if (!taskSnap.exists()) throw new Error("Task does not exist!");
      const taskData = taskSnap.data();
      if (taskData.status !== "pending") throw new Error("Task is already processed.");
      
      const rec = taskData.recurrence;
      if (!rec) {
        transaction.update(taskRef, {
          status: action === "complete" ? "completed" : "skipped",
          completedAt: action === "complete" ? new Date().toISOString() : null,
        });
        return;
      }
      
      const templateId = rec.templateId;
      const templateRef = doc(db, "tasks", templateId);
      const templateSnap = await transaction.get(templateRef);
      
      if (!templateSnap.exists()) {
        transaction.update(taskRef, {
          status: action === "complete" ? "completed" : "skipped",
          completedAt: action === "complete" ? new Date().toISOString() : null,
          recurrence: null
        });
        return;
      }
      
      const templateData = templateSnap.data();
      const templateRec = templateData.recurrence;
      
      const currentDueDate = taskData.deadline || taskData.startDate;
      const nextDueDate = calculateNextDueDate(templateRec, currentDueDate);
      result.nextDueStr = nextDueDate;
      
      const completedCount = (templateRec.completedCount || 0) + (action === "complete" ? 1 : 0);
      const skippedCount = (templateRec.skippedCount || 0) + (action === "skip" ? 1 : 0);
      let shouldSpawn = true;
      
      if (templateRec.endsOn === "count") {
        if (completedCount + skippedCount >= (templateRec.maxOccurrences || 1)) {
          shouldSpawn = false;
        }
      } else if (templateRec.endsOn === "date") {
        const endDateStr = templateRec.endDate; // Assuming it's YYYY-MM-DD
        if (isAfter(startOfDay(parseISO(nextDueDate)), startOfDay(parseISO(endDateStr)))) {
          shouldSpawn = false;
        }
      }
      
      if (!shouldSpawn) result.seriesEnded = true;

      // Update current instance
      transaction.update(taskRef, {
        status: action === "complete" ? "completed" : "skipped",
        completedAt: action === "complete" ? new Date().toISOString() : null,
      });
      
      // Update template
      let currentStreak = templateRec.streak || 0;
      if (action === "complete") {
        currentStreak += 1;
      } else {
        currentStreak = 0;
      }
      const longestStreak = Math.max(currentStreak, templateRec.longestStreak || 0);
      
      transaction.update(templateRef, {
        "recurrence.completedCount": completedCount,
        "recurrence.skippedCount": skippedCount,
        "recurrence.streak": currentStreak,
        "recurrence.longestStreak": longestStreak,
        "recurrence.nextDueDate": shouldSpawn ? nextDueDate : null,
      });
      
      if (shouldSpawn) {
        const newInstanceRef = doc(collection(db, "tasks"));
        result.newTaskId = newInstanceRef.id;
        
        const { id, ...templateDataToCopy } = templateData;
        const newInstanceData = {
          ...templateDataToCopy,
          status: "pending",
          completedAt: null,
          startDate: nextDueDate,
          endDate: nextDueDate,
          deadline: nextDueDate,
          createdAt: serverTimestamp(),
          recurrence: {
            ...templateRec,
            instanceIndex: (rec.instanceIndex || 1) + 1,
            // Only template holds cumulative stats
          }
        };
        
        transaction.set(newInstanceRef, newInstanceData);
      }
    });
    
    return result;
  } catch (err) {
    console.error("Error processing recurring task:", err);
    throw err;
  }
}

