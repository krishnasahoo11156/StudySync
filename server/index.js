/* ═══════════════════════════════════════════════════════════
   StudySync — Email Notification Server
   Uses: Express · Nodemailer (Gmail SMTP) · node-cron · dotenv · cors
═══════════════════════════════════════════════════════════ */

import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import nodemailer from "nodemailer";

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Nodemailer Gmail transporter ────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((err, success) => {
  if (err) {
    console.error(`[${new Date().toISOString()}] ❌ SMTP connection failed:`, err.message);
  } else {
    console.log(`[${new Date().toISOString()}] ✅ Gmail SMTP ready — connected as ${process.env.GMAIL_USER}`);
  }
});

const FROM = `StudySync <${process.env.GMAIL_USER}>`;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Health check ───────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/", (_req, res) => res.json({ status: "StudySync email server running ✓" }));

/* ═══════════════════════════════════════════
   SHARED LAYOUT HELPERS
═══════════════════════════════════════════ */
function emailWrapper(headerColor, headerHtml, bodyHtml, footerNote = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>StudySync</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:${headerColor};border-radius:16px 16px 0 0;padding:32px 40px;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🌿 StudySync</p>
            ${headerHtml}
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 28px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f0f4f0;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #e2e8e2;">
            <p style="margin:0;font-size:11px;color:#8a9e8a;text-align:center;line-height:1.6;">
              ${footerNote || "You received this email because you have an account on StudySync."}<br />
              <a href="#" style="color:#1a7a4a;text-decoration:underline;">Unsubscribe</a>
              &nbsp;·&nbsp;
              <a href="#" style="color:#1a7a4a;text-decoration:underline;">Manage preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(label, href, color = "#1a7a4a") {
  return `<a href="${href}" style="display:inline-block;margin-top:28px;background:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.2px;">${label}</a>`;
}

function statCard(value, label, color = "#1a7a4a") {
  return `<td style="text-align:center;padding:0 8px;">
    <div style="background:#f0faf0;border-radius:12px;padding:20px 16px;min-width:110px;">
      <p style="margin:0;font-size:28px;font-weight:800;color:${color};">${value}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#5a7a5a;font-weight:500;">${label}</p>
    </div>
  </td>`;
}

/* Helper: send via Nodemailer */
async function sendMail(to, subject, html) {
  return transporter.sendMail({ from: FROM, to, subject, html });
}

/* ═══════════════════════════════════════════
   EMAIL 1 — WELCOME
   POST /send-email/welcome
   Body: { firstName, email }
═══════════════════════════════════════════ */
app.post("/send-email/welcome", async (req, res) => {
  const { firstName = "Student", email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const html = emailWrapper(
    "#1a7a4a",
    `<p style="margin:12px 0 0;font-size:16px;color:#b7e4c7;font-weight:500;">Your sanctuary is ready.</p>`,
    `<p style="font-size:22px;font-weight:700;color:#1a2e1a;margin:0 0 12px;">Welcome, ${firstName}! 🎉</p>
     <p style="font-size:15px;color:#374a37;line-height:1.7;margin:0 0 24px;">
       We're so glad you're here. StudySync is your calm corner for intentional learning — everything you need to stay focused, organised, and consistent.
     </p>
     <p style="font-size:14px;font-weight:700;color:#1a2e1a;margin:0 0 12px;">Here's what's waiting for you:</p>
     <table cellpadding="0" cellspacing="0" style="width:100%;">
       <tr>
         <td style="padding:8px 12px 8px 0;vertical-align:top;width:28px;font-size:18px;">📊</td>
         <td style="padding:8px 0;vertical-align:top;font-size:14px;color:#374a37;line-height:1.5;"><strong>Dashboard</strong> — See your tasks, streaks, and progress at a glance.</td>
       </tr>
       <tr>
         <td style="padding:8px 12px 8px 0;vertical-align:top;font-size:18px;">📅</td>
         <td style="padding:8px 0;vertical-align:top;font-size:14px;color:#374a37;line-height:1.5;"><strong>Calendar</strong> — Plan your week and never miss a deadline.</td>
       </tr>
       <tr>
         <td style="padding:8px 12px 8px 0;vertical-align:top;font-size:18px;">🎯</td>
         <td style="padding:8px 0;vertical-align:top;font-size:14px;color:#374a37;line-height:1.5;"><strong>Focus</strong> — Deep work sessions with a built-in Pomodoro timer.</td>
       </tr>
       <tr>
         <td style="padding:8px 12px 8px 0;vertical-align:top;font-size:18px;">📚</td>
         <td style="padding:8px 0;vertical-align:top;font-size:14px;color:#374a37;line-height:1.5;"><strong>Library</strong> — Store your notes, resources, and references.</td>
       </tr>
     </table>
     ${ctaButton("Enter your sanctuary →", "https://study-sync-eosin-seven.vercel.app/dashboard")}`,
    `This email was sent to ${email} because you signed up for StudySync.`
  );

  try {
    console.log(`[${new Date().toISOString()}] Sending welcome email to ${email}...`);
    await sendMail(email, "Your StudySync sanctuary is ready 🌿", html);
    console.log(`[${new Date().toISOString()}] ✅ Welcome email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Welcome email error for ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   EMAIL 2 — TASK COMPLETE DIGEST
   POST /send-email/task-complete
   Body: { firstName, email, completedThisWeek, totalTasks, lastTaskName }
═══════════════════════════════════════════ */
app.post("/send-email/task-complete", async (req, res) => {
  const { firstName = "Student", email, completedThisWeek = 0, totalTasks = 0, lastTaskName = "Untitled task" } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const remaining = Math.max(0, totalTasks - completedThisWeek);

  const html = emailWrapper(
    "#1a7a4a",
    `<p style="margin:12px 0 0;font-size:16px;color:#b7e4c7;font-weight:500;">Task Completion Digest</p>`,
    `<p style="font-size:22px;font-weight:700;color:#1a2e1a;margin:0 0 10px;">You're making real progress, ${firstName}! ✅</p>
     <p style="font-size:15px;color:#374a37;line-height:1.7;margin:0 0 28px;">Here's a quick look at your task activity this week:</p>

     <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
       <tr>
         ${statCard(completedThisWeek, "Completed This Week")}
         ${statCard(remaining, "Still Remaining", "#b35c00")}
       </tr>
     </table>

     <p style="font-size:13px;font-weight:700;color:#1a2e1a;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.8px;">Last completed</p>
     <div style="background:#f0faf0;border-left:4px solid #1a7a4a;border-radius:6px;padding:14px 18px;margin-bottom:8px;">
       <p style="margin:0;font-size:15px;color:#1a7a4a;font-weight:700;">${lastTaskName}</p>
     </div>
     <p style="font-size:14px;color:#374a37;line-height:1.7;margin:8px 0 0;">
       Every task you complete is a step forward. Keep up the momentum — you've got this! 💪
     </p>
     ${ctaButton("View all tasks →", "https://study-sync-eosin-seven.vercel.app/dashboard")}`
  );

  try {
    console.log(`[${new Date().toISOString()}] Sending task-complete email to ${email}...`);
    await sendMail(email, `You're making progress, ${firstName} ✅`, html);
    console.log(`[${new Date().toISOString()}] ✅ Task-complete email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Task-complete email error for ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   EMAIL 3 — OVERDUE REMINDER
   POST /send-email/overdue
   Body: { firstName, email, overdueTasks: [{ title, daysOverdue }] }
═══════════════════════════════════════════ */
app.post("/send-email/overdue", async (req, res) => {
  const { firstName = "Student", email, overdueTasks = [] } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const taskCards = overdueTasks.map(t => `
    <div style="border:1px solid #fde8cc;border-left:4px solid #b35c00;border-radius:8px;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#1a2e1a;">${t.title}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#b35c00;">Overdue by ${t.daysOverdue} day${t.daysOverdue !== 1 ? "s" : ""}</p>
    </div>`).join("");

  const html = emailWrapper(
    "#b35c00",
    `<p style="margin:12px 0 0;font-size:16px;color:#fde8cc;font-weight:500;">Overdue Task Reminder</p>`,
    `<p style="font-size:22px;font-weight:700;color:#1a2e1a;margin:0 0 10px;">Hey ${firstName}, don't let these slip!</p>
     <p style="font-size:15px;color:#374a37;line-height:1.7;margin:0 0 24px;">
       The following ${overdueTasks.length === 1 ? "task is" : "tasks are"} overdue by 3 or more days. A quick focus session can help you catch up!
     </p>
     ${taskCards}
     <p style="font-size:14px;color:#374a37;line-height:1.7;margin:16px 0 0;">
       💡 <strong>Tip:</strong> Start a 25-minute Focus session — even a small dent in an overdue task helps ease the mental load.
     </p>
     ${ctaButton("Start a focus session →", "https://study-sync-eosin-seven.vercel.app/focus", "#b35c00")}`
  );

  try {
    console.log(`[${new Date().toISOString()}] Sending overdue email to ${email}...`);
    await sendMail(email, `⚠ A task needs your attention, ${firstName}`, html);
    console.log(`[${new Date().toISOString()}] ✅ Overdue email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Overdue email error for ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   EMAIL 4 — SECURITY ALERT
   POST /send-email/security
   Body: { email, changeDateTime }
═══════════════════════════════════════════ */
app.post("/send-email/security", async (req, res) => {
  const { email, changeDateTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const html = emailWrapper(
    "#c0392b",
    `<p style="margin:12px 0 0;font-size:16px;color:#fadadd;font-weight:500;">Security Alert</p>`,
    `<p style="font-size:22px;font-weight:700;color:#1a2e1a;margin:0 0 10px;">Your password was changed 🔐</p>
     <p style="font-size:15px;color:#374a37;line-height:1.7;margin:0 0 24px;">
       A password reset email was sent for your StudySync account on:
     </p>
     <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:center;">
       <p style="margin:0;font-size:16px;font-weight:700;color:#1a2e1a;">${changeDateTime}</p>
     </div>

     <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #c0392b;border-radius:8px;padding:16px 18px;margin-bottom:24px;">
       <p style="margin:0;font-size:14px;font-weight:700;color:#c0392b;">
         🚨 If this wasn't you, secure your account immediately.
       </p>
       <p style="margin:8px 0 0;font-size:13px;color:#7f1d1d;line-height:1.6;">
         Reset your password and review your account activity. If you need help, contact our support team.
       </p>
     </div>

     <p style="font-size:14px;color:#374a37;line-height:1.7;margin:0;">
       If you made this change, no further action is needed. Your account is secure.
     </p>
     ${ctaButton("Secure my account →", "https://study-sync-eosin-seven.vercel.app/login", "#c0392b")}`,
    "This is a mandatory security email and cannot be unsubscribed."
  );

  try {
    console.log(`[${new Date().toISOString()}] Sending security email to ${email}...`);
    await sendMail(email, "Security alert: your StudySync password was changed", html);
    console.log(`[${new Date().toISOString()}] ✅ Security email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Security email error for ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   EMAIL 5 — STREAK MILESTONE
   POST /send-email/streak
   Body: { firstName, email, streakDays, avgDailyHours, totalWeeklyHours }
═══════════════════════════════════════════ */
app.post("/send-email/streak", async (req, res) => {
  const { firstName = "Student", email, streakDays = 7, avgDailyHours = 0, totalWeeklyHours = 0 } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const html = emailWrapper(
    "#6b21a8",
    `<p style="margin:12px 0 0;font-size:16px;color:#e9d5ff;font-weight:500;">Streak Milestone 🔥</p>`,
    `<p style="font-size:22px;font-weight:700;color:#1a2e1a;margin:0 0 10px;">
       ${streakDays}-day streak, ${firstName}! You're on fire! 🔥
     </p>
     <p style="font-size:15px;color:#374a37;line-height:1.7;margin:0 0 28px;">
       Consistency is a superpower, and you're proving it every single day. Here's a snapshot of your focus effort:
     </p>

     <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
       <tr>
         ${statCard(streakDays, "Day Streak 🔥", "#6b21a8")}
         ${statCard(avgDailyHours + "h", "Avg Daily Focus", "#1a7a4a")}
         ${statCard(totalWeeklyHours + "h", "Total This Week", "#0891b2")}
       </tr>
     </table>

     <p style="font-size:14px;color:#374a37;line-height:1.7;margin:0;">
       🌟 Keep showing up every day — even 20 minutes of focused study compounds into remarkable results over time. You're building something extraordinary.
     </p>
     ${ctaButton("Keep the streak going →", "https://study-sync-eosin-seven.vercel.app/focus", "#6b21a8")}`
  );

  try {
    console.log(`[${new Date().toISOString()}] Sending streak email to ${email}...`);
    await sendMail(email, `🔥 ${streakDays}-day streak! You're on fire, ${firstName}`, html);
    console.log(`[${new Date().toISOString()}] ✅ Streak email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Streak email error for ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   EMAIL 6 — WEEKLY DIGEST
   POST /send-email/weekly
   Body: { firstName, email, tasksDone, focusHours, streak, topSubject }
═══════════════════════════════════════════ */
app.post("/send-email/weekly", async (req, res) => {
  const { firstName = "Student", email, tasksDone = 0, focusHours = 0, streak = 0, topSubject = "General" } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const html = emailWrapper(
    "#006064",
    `<p style="margin:12px 0 0;font-size:16px;color:#b2dfdb;font-weight:500;">Your Week in Review 📊</p>`,
    `<p style="font-size:22px;font-weight:700;color:#1a2e1a;margin:0 0 10px;">Great work this week, ${firstName}! 🎓</p>
     <p style="font-size:15px;color:#374a37;line-height:1.7;margin:0 0 28px;">
       Here's a summary of everything you accomplished from Monday to today:
     </p>

     <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
       <tr>
         ${statCard(tasksDone, "Tasks Done", "#006064")}
         ${statCard(focusHours + "h", "Focus Hours", "#1a7a4a")}
         ${statCard(streak, "Day Streak", "#6b21a8")}
       </tr>
     </table>

     <p style="font-size:13px;font-weight:700;color:#1a2e1a;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.8px;">Top subject this week</p>
     <div style="background:#e0f7fa;border-left:4px solid #006064;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
       <p style="margin:0;font-size:16px;color:#006064;font-weight:700;">📖 ${topSubject}</p>
     </div>

     <p style="font-size:14px;color:#374a37;line-height:1.7;margin:0;">
       A new week is a fresh start. Plan ahead, set clear goals, and watch how much you can achieve when you stay intentional. 🌱
     </p>
     ${ctaButton("Plan next week →", "https://study-sync-eosin-seven.vercel.app/calendar", "#006064")}`
  );

  try {
    console.log(`[${new Date().toISOString()}] Sending weekly digest email to ${email}...`);
    await sendMail(email, "Your StudySync week in review 📊", html);
    console.log(`[${new Date().toISOString()}] ✅ Weekly digest email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Weekly digest email error for ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   WEEKLY CRON — every Monday at 8:00 AM IST
   (UTC 02:30 = 8:00 AM IST)
═══════════════════════════════════════════ */
cron.schedule("0 2 * * 1", () => {
  console.log(`[${new Date().toISOString()}] [CRON] Monday 8AM IST — wire up weekly digest to Firestore user collection here.`);
  // TODO: fetch all users with emailPrefs.weeklyDigest === true from Firestore
  // and POST to /send-email/weekly for each user.
});

/* ═══════════════════════════════════════════
   START
═══════════════════════════════════════════ */
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] ✅ StudySync email server running on port ${PORT}`));
