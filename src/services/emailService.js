/* ═══════════════════════════════════════════════════════════
   StudySync — Email Service (client-side)
   Calls the Express /server backend to send emails via Gmail SMTP.
   The server URL is stored in .env.local (VITE_SERVER_URL).
   Email failures are ALWAYS silent — they must never crash the app.
═══════════════════════════════════════════════════════════ */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

/** Generic POST helper — throws on non-2xx */
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
 * @param {{ firstName: string, email: string }} data
 */
export function sendWelcomeEmail({ firstName, email }) {
  return post("/send-email/welcome", { firstName, email }).catch(err => {
    console.error("[EmailService] Welcome email failed:", err.message);
  });
}

/**
 * Email 2 — Task Complete Digest
 * Call when a user marks a task done (max once per 24h — enforced by caller).
 * @param {{ firstName: string, email: string, completedThisWeek: number, totalTasks: number, lastTaskName: string }} data
 */
export function sendTaskCompleteEmail({ firstName, email, completedThisWeek, totalTasks, lastTaskName }) {
  return post("/send-email/task-complete", { firstName, email, completedThisWeek, totalTasks, lastTaskName }).catch(err => {
    console.error("[EmailService] Task-complete email failed:", err.message);
  });
}

/**
 * Email 3 — Overdue Reminder
 * Call when tasks are found to be overdue by 3+ days (max once per 24h).
 * @param {{ firstName: string, email: string, overdueTasks: { title: string, daysOverdue: number }[] }} data
 */
export function sendOverdueEmail({ firstName, email, overdueTasks }) {
  return post("/send-email/overdue", { firstName, email, overdueTasks }).catch(err => {
    console.error("[EmailService] Overdue email failed:", err.message);
  });
}

/**
 * Email 4 — Security Alert (always sent — cannot be disabled)
 * Call when the user clicks "Send Reset Email" in profile panel.
 * @param {{ email: string, changeDateTime?: string }} data
 */
export function sendSecurityEmail({ email, changeDateTime }) {
  return post("/send-email/security", {
    email,
    changeDateTime: changeDateTime || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  }).catch(err => {
    console.error("[EmailService] Security email failed:", err.message);
  });
}

/**
 * Email 5 — Streak Milestone
 * Call when streak hits 3, 7, 14, or 30 days (once per milestone).
 * @param {{ firstName: string, email: string, streakDays: number, avgDailyHours: number, totalWeeklyHours: number }} data
 */
export function sendStreakEmail({ firstName, email, streakDays, avgDailyHours, totalWeeklyHours }) {
  return post("/send-email/streak", { firstName, email, streakDays, avgDailyHours, totalWeeklyHours }).catch(err => {
    console.error("[EmailService] Streak email failed:", err.message);
  });
}

/**
 * Email 6 — Weekly Digest
 * Call every Monday (checked on app mount).
 * @param {{ firstName: string, email: string, tasksDone: number, focusHours: number, streak: number, topSubject: string }} data
 */
export function sendWeeklyDigestEmail({ firstName, email, tasksDone, focusHours, streak, topSubject }) {
  return post("/send-email/weekly", { firstName, email, tasksDone, focusHours, streak, topSubject }).catch(err => {
    console.error("[EmailService] Weekly digest email failed:", err.message);
  });
}

/** Milestone streak values that trigger an email */
export const STREAK_MILESTONES = new Set([3, 7, 14, 30]);
