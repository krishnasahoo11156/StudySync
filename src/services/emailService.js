/* ═══════════════════════════════════════════════════════════
   StudySync — Email Service (client-side)
   Calls the Express /server backend to send emails via Resend.
   The server URL is stored in .env (VITE_SERVER_URL).
   NEVER put the Resend API key here.
═══════════════════════════════════════════════════════════ */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

/** Generic POST helper */
async function post(endpoint, body) {
  const res = await fetch(`${SERVER_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Email 1 — Welcome
 * Call right after a new user signs up.
 * @param {string} firstName
 * @param {string} email
 */
export function sendWelcomeEmail(firstName, email) {
  return post("/send-email/welcome", { firstName, email });
}

/**
 * Email 2 — Task Complete Digest
 * Call when a user marks a task done (max once per day — enforce on the caller side).
 * @param {{ firstName, email, completedThisWeek, totalTasks, lastTaskName }} data
 */
export function sendTaskCompleteEmail(data) {
  return post("/send-email/task-complete", data);
}

/**
 * Email 3 — Overdue Reminder
 * Call when tasks are found to be overdue by 3+ days.
 * @param {{ firstName, email, overdueTasks: { name: string, daysOverdue: number }[] }} data
 */
export function sendOverdueEmail(data) {
  return post("/send-email/overdue", data);
}

/**
 * Email 4 — Security Alert (always sent — preference is locked on)
 * Call when the user clicks "Send Reset Email".
 * @param {string} email
 * @param {string} [changeDateTime] - human-readable date/time string
 */
export function sendSecurityEmail(email, changeDateTime) {
  return post("/send-email/security", {
    email,
    changeDateTime: changeDateTime || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  });
}

/**
 * Email 5 — Streak Milestone
 * Call when streak hits 3, 7, 14, or 30 days.
 * @param {{ firstName, email, streakDays, avgDailyHours, totalWeeklyHours }} data
 */
export function sendStreakEmail(data) {
  return post("/send-email/streak", data);
}

/**
 * Email 6 — Weekly Digest
 * Call every Monday (triggered by server cron or manually).
 * @param {{ firstName, email, tasksDone, focusHours, streak, topSubject }} data
 */
export function sendWeeklyEmail(data) {
  return post("/send-email/weekly", data);
}

/** Milestone streak values that trigger an email */
export const STREAK_MILESTONES = new Set([3, 7, 14, 30]);
