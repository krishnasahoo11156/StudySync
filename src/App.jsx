import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import LibraryPage from "./pages/LibraryPage";
import FocusPage from "./pages/FocusPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CalendarPage from "./pages/CalendarPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <WeeklyDigestTrigger />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <LibraryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/focus"
            element={
              <ProtectedRoute>
                <FocusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

/* ═══════════════════════════════════════════════════════════
   Trigger 6 — Weekly Digest Email
   Runs once on app mount. Fires on Mondays if not sent in last 6 days.
═══════════════════════════════════════════════════════════ */
import { useAuth } from "./contexts/AuthContext";
import { db } from "./firebase/config";
import {
  doc, getDoc, setDoc, getDocs,
  collection, query, where,
} from "firebase/firestore";
import { sendWeeklyDigestEmail } from "./services/emailService";

function WeeklyDigestTrigger() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const isMonday = new Date().getDay() === 1;
    if (!isMonday) return;

    const run = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        const lastSent = userData?.lastWeeklyEmailSent;
        const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
        const cooldownOk = !lastSent || (Date.now() - new Date(lastSent).getTime() > sixDaysMs);

        if (!cooldownOk) return;

        // Gather weekly stats — tasks completed in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const tasksSnap = await getDocs(
          query(collection(db, "tasks"), where("userId", "==", user.uid))
        );
        const allTasks = tasksSnap.docs.map(d => d.data());
        const recentCompleted = allTasks.filter(
          t => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= sevenDaysAgo
        );
        const tasksDone = recentCompleted.length;

        // Top subject (most frequent tag among completed tasks this week)
        const subjectCounts = {};
        recentCompleted.forEach(t => {
          if (t.subject) subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1;
        });
        const topSubject = Object.keys(subjectCounts).sort((a, b) => subjectCounts[b] - subjectCounts[a])[0] || "General";

        // Focus hours + streak from focus_prefs
        const prefSnap = await getDoc(doc(db, "focus_prefs", user.uid));
        const prefData = prefSnap.exists() ? prefSnap.data() : {};
        const focusHours = Math.round((prefData.focusedToday || 0) / 60 * 10) / 10;
        const streak = prefData.streak || 0;

        const firstName = (user.displayName || user.email || "Student").split(" ")[0];

        sendWeeklyDigestEmail({ firstName, email: user.email, tasksDone, focusHours, streak, topSubject });
        await setDoc(userRef, { lastWeeklyEmailSent: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.error("[WeeklyDigest] Failed:", e.message);
      }
    };

    run();
  }, [user]);

  return null;
}

export default App;
