import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProfilePanel } from "../contexts/ProfilePanelContext";
import { db, auth } from "../firebase/config";
import {
  collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

/* ── Avatar colour swatches ── */
const AVATAR_COLOURS = [
  { id: "green",    hex: "#22c55e", label: "Forest" },
  { id: "emerald",  hex: "#10b981", label: "Emerald" },
  { id: "teal",     hex: "#14b8a6", label: "Teal" },
  { id: "cyan",     hex: "#06b6d4", label: "Cyan" },
  { id: "lime",     hex: "#84cc16", label: "Lime" },
  { id: "olive",    hex: "#65a30d", label: "Olive" },
];

/* ── Badge logic ── */
function getBadge(weeklyCompleted) {
  if (weeklyCompleted >= 7) return { label: "Active Learner", bg: "#dcfce7", color: "#15803d" };
  if (weeklyCompleted >= 3) return { label: "On a Roll",      bg: "#d1fae5", color: "#047857" };
  return                          { label: "Getting Started", bg: "#f0faf0", color: "#22c55e" };
}

/* ── Streak calc from tasks ── */
function calcStreak(tasks) {
  const completedDates = new Set(
    tasks
      .filter(t => t.status === "completed" && t.completedAt)
      .map(t => t.completedAt.split("T")[0])
  );
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const ds = d.toISOString().split("T")[0];
    if (completedDates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/* ── Weekly completed tasks ── */
function calcWeeklyCompleted(tasks) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return tasks.filter(t => {
    if (t.status !== "completed" || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= monday && d <= now;
  }).length;
}

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="profile-toast">
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#22c55e" }}>check_circle</span>
      {message}
    </div>
  );
}

/* ══════════════════════════════════════
   TOGGLE SWITCH
══════════════════════════════════════ */
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="profile-toggle"
      style={{
        background: checked ? "#22c55e" : "#d1d5db",
        transition: "background 200ms ease",
      }}
    >
      <span
        className="profile-toggle-knob"
        style={{ transform: checked ? "translateX(16px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ══════════════════════════════════════
   MENU ROW
══════════════════════════════════════ */
function MenuRow({ icon, label, onClick, rightElement, red }) {
  return (
    <button className="profile-menu-row" onClick={onClick} style={red ? { color: "#dc2626" } : {}}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: red ? "#dc2626" : "#22c55e", flexShrink: 0 }}
      >
        {icon}
      </span>
      <span className="profile-menu-label" style={red ? { color: "#dc2626" } : {}}>{label}</span>
      <span style={{ marginLeft: "auto" }}>
        {rightElement ?? (
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#5a7a5a", opacity: 0.6 }}>
            chevron_right
          </span>
        )}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function ProfilePanel() {
  const { user, logout } = useAuth();
  const { isOpen, close } = useProfilePanel();
  const navigate = useNavigate();

  /* ── Data states ── */
  const [tasks, setTasks]         = useState([]);
  const [userDoc, setUserDoc]     = useState({});
  const [prefs, setPrefs]         = useState({ dueDateReminders: true, focusAlerts: false, weeklySummary: true });

  /* ── UI states ── */
  const [view, setView]           = useState("menu"); // "menu" | "editProfile" | "notifications" | "changePassword"
  const [avatarColour, setAvatarColour] = useState("green");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [saving, setSaving]       = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [toast, setToast]         = useState(null);
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [changePassExpanded, setChangePassExpanded] = useState(false);

  /* ── Animation states ── */
  const [animState, setAnimState] = useState("closed"); // "closed" | "opening" | "open" | "closing"

  const panelRef = useRef(null);

  /* ── Open/close animation ── */
  useEffect(() => {
    if (isOpen) {
      setAnimState("opening");
      const t = setTimeout(() => setAnimState("open"), 10);
      return () => clearTimeout(t);
    } else {
      if (animState === "open" || animState === "opening") {
        setAnimState("closing");
        const t = setTimeout(() => setAnimState("closed"), 310);
        return () => clearTimeout(t);
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Reset view when panel closes ── */
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setView("menu");
        setNotifExpanded(false);
        setChangePassExpanded(false);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ── Escape key to close ── */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  /* ── Click-outside to close ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Allow the avatar buttons to handle their own click (they use toggle)
        close();
      }
    };
    // Delay to avoid immediate close on the same click that opened
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [isOpen, close]);

  /* ── Firestore: tasks subscription ── */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  /* ── Firestore: user doc subscription ── */
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    return onSnapshot(ref, snap => {
      const data = snap.data() || {};
      setUserDoc(data);
      setAvatarColour(data.avatarColour || "green");
      setDisplayNameInput(user.displayName || "");
      if (data.preferences) setPrefs(p => ({ ...p, ...data.preferences }));
    });
  }, [user]);

  /* ── Computed ── */
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const streak    = calcStreak(tasks);
  const weeklyCompleted = calcWeeklyCompleted(tasks);
  const badge     = getBadge(weeklyCompleted);

  const displayName = userDoc.displayName || user?.displayName || user?.email?.split("@")[0] || "Student";
  const email       = user?.email || "";
  const initials    = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarBg    = AVATAR_COLOURS.find(c => c.id === avatarColour)?.hex || "#22c55e";

  /* ── Save profile ── */
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayNameInput });
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayNameInput,
        avatarColour,
        email,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setToast("Profile updated ✓");
      setView("menu");
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Save pref toggle ── */
  const savePref = useCallback(async (key, value) => {
    if (!user) return;
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await setDoc(doc(db, "users", user.uid), { preferences: newPrefs }, { merge: true });
    } catch (err) {
      console.error("Pref save error:", err);
    }
  }, [user, prefs]);

  /* ── Sign out ── */
  const handleSignOut = async () => {
    setSigningOut(true);
    await new Promise(r => setTimeout(r, 2000));
    try { await logout(); navigate("/"); }
    catch (err) { console.error(err); setSigningOut(false); }
  };

  /* ── Don't render DOM if fully closed ── */
  if (animState === "closed") return null;

  const isAnimatingIn  = animState === "opening" || animState === "open";
  const isAnimatingOut = animState === "closing";

  return (
    <>
      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* ── Panel ── */}
      <div
        ref={panelRef}
        id="profile-panel"
        className="profile-panel"
        style={{
          opacity:   isAnimatingOut ? 0 : isAnimatingIn ? 1 : 0,
          transform: isAnimatingOut
            ? "translateY(-12px) scale(0.97)"
            : isAnimatingIn
            ? "translateY(0) scale(1)"
            : "translateY(-12px) scale(0.97)",
          transition: "opacity 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ════════════ HEADER ════════════ */}
        <div className="profile-header">
          <div
            className="profile-avatar-lg"
            style={{ background: avatarBg }}
          >
            {initials || "S"}
          </div>
          <p className="profile-name">{displayName}</p>
          <p className="profile-email">{email}</p>
          <span className="profile-badge" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>

        {/* ════════════ STATS ROW ════════════ */}
        <div className="profile-stats-row">
          <div className="profile-stat">
            <span className="profile-stat-num">{total}</span>
            <span className="profile-stat-label">Total Tasks</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-num">{completed}</span>
            <span className="profile-stat-label">Completed</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-num">{streak}</span>
            <span className="profile-stat-label">Day Streak</span>
          </div>
        </div>

        {/* ════════════ BODY ════════════ */}
        <div className="profile-body">

          {/* ── MENU VIEW ── */}
          <div
            className="profile-view"
            style={{
              opacity:   view === "menu" ? 1 : 0,
              transform: view === "menu" ? "translateY(0)" : "translateY(-8px)",
              pointerEvents: view === "menu" ? "auto" : "none",
              position: view === "editProfile" ? "absolute" : "relative",
              width: "100%",
              transition: "opacity 150ms ease, transform 150ms ease",
            }}
          >
            {/* ACCOUNT */}
            <p className="profile-section-label">ACCOUNT</p>
            <MenuRow
              icon="manage_accounts"
              label="Edit Profile"
              onClick={() => { setDisplayNameInput(displayName); setView("editProfile"); }}
            />
            <MenuRow
              icon="lock"
              label="Change Password"
              onClick={() => setChangePassExpanded(v => !v)}
              rightElement={
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#5a7a5a", opacity: 0.6 }}>
                  {changePassExpanded ? "expand_less" : "expand_more"}
                </span>
              }
            />
            {/* Change password inline */}
            {changePassExpanded && (
              <div className="profile-expand-section animate-fade-in">
                <p style={{ fontSize: 12, color: "#5a7a5a", lineHeight: 1.5 }}>
                  A password reset email will be sent to <strong>{email}</strong>.
                </p>
                <button
                  className="profile-btn-green"
                  onClick={async () => {
                    const { sendPasswordResetEmail } = await import("firebase/auth");
                    await sendPasswordResetEmail(auth, email);
                    setToast("Reset email sent ✓");
                    setChangePassExpanded(false);
                  }}
                >
                  Send Reset Email
                </button>
              </div>
            )}

            {/* PREFERENCES */}
            <p className="profile-section-label" style={{ marginTop: 8 }}>PREFERENCES</p>
            <MenuRow
              icon="settings"
              label="Settings"
              onClick={() => { close(); navigate("/dashboard"); }}
            />
            <MenuRow
              icon="notifications"
              label="Notifications"
              onClick={() => setNotifExpanded(v => !v)}
              rightElement={
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#5a7a5a", opacity: 0.6 }}>
                  {notifExpanded ? "expand_less" : "expand_more"}
                </span>
              }
            />
            {/* Notifications inline expand */}
            {notifExpanded && (
              <div className="profile-expand-section animate-fade-in">
                <div className="profile-toggle-row">
                  <span style={{ fontSize: 12, color: "#1a2e1a", fontWeight: 500 }}>Due Date Reminders</span>
                  <Toggle checked={prefs.dueDateReminders} onChange={v => savePref("dueDateReminders", v)} />
                </div>
                <div className="profile-toggle-row">
                  <span style={{ fontSize: 12, color: "#1a2e1a", fontWeight: 500 }}>Focus Session Alerts</span>
                  <Toggle checked={prefs.focusAlerts} onChange={v => savePref("focusAlerts", v)} />
                </div>
                <div className="profile-toggle-row">
                  <span style={{ fontSize: 12, color: "#1a2e1a", fontWeight: 500 }}>Weekly Summary</span>
                  <Toggle checked={prefs.weeklySummary} onChange={v => savePref("weeklySummary", v)} />
                </div>
              </div>
            )}

            {/* DIVIDER + SIGN OUT */}
            <div className="profile-divider" />
            <button
              id="profile-signout-btn"
              className="profile-menu-row profile-signout"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <span className="material-symbols-outlined profile-spin" style={{ fontSize: 18, color: "#dc2626" }}>
                    progress_activity
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Signing out…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#dc2626" }}>logout</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Sign Out</span>
                </>
              )}
            </button>
          </div>

          {/* ── EDIT PROFILE VIEW ── */}
          <div
            className="profile-view"
            style={{
              opacity:   view === "editProfile" ? 1 : 0,
              transform: view === "editProfile" ? "translateY(0)" : "translateY(8px)",
              pointerEvents: view === "editProfile" ? "auto" : "none",
              position: view === "menu" ? "absolute" : "relative",
              width: "100%",
              transition: "opacity 200ms ease 50ms, transform 200ms ease 50ms",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <button
                className="profile-back-btn"
                onClick={() => setView("menu")}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2e1a" }}>Edit Profile</span>
            </div>

            {/* Name field */}
            <label className="profile-field-label">Display Name</label>
            <input
              className="profile-input"
              value={displayNameInput}
              onChange={e => setDisplayNameInput(e.target.value)}
              placeholder="Your name"
              maxLength={40}
            />

            {/* Avatar colour picker */}
            <label className="profile-field-label" style={{ marginTop: 14 }}>Avatar Colour</label>
            <div className="profile-swatches">
              {AVATAR_COLOURS.map(c => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => setAvatarColour(c.id)}
                  className="profile-swatch"
                  style={{
                    background: c.hex,
                    outline: avatarColour === c.id ? `3px solid ${c.hex}` : "none",
                    outlineOffset: 2,
                    boxShadow: avatarColour === c.id ? `0 0 0 5px ${c.hex}22` : "none",
                  }}
                >
                  {avatarColour === c.id && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>
                  )}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 18px" }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: avatarBg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 14,
                  border: "2px solid #fff",
                  boxShadow: `0 0 0 3px ${avatarBg}44`,
                }}
              >
                {(displayNameInput || "S").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <span style={{ fontSize: 12, color: "#5a7a5a" }}>Preview</span>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="profile-btn-green"
                style={{ flex: 1 }}
                onClick={saveProfile}
                disabled={saving || !displayNameInput.trim()}
              >
                {saving ? (
                  <span className="material-symbols-outlined profile-spin" style={{ fontSize: 16 }}>progress_activity</span>
                ) : "Save Changes"}
              </button>
              <button
                className="profile-btn-grey"
                onClick={() => setView("menu")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>

        </div>{/* /profile-body */}
      </div>
    </>
  );
}
