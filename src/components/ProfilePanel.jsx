import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProfilePanel } from "../contexts/ProfilePanelContext";
import { db, auth } from "../firebase/config";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { sendSecurityEmail } from "../services/emailService";

/* ── Resize image to base64 (no Firebase Storage needed) ── */
function resizeImageToBase64(file, maxPx = 200, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const AVATAR_COLOURS = [
  { id: "green",   hex: "#22c55e", label: "Forest"  },
  { id: "emerald", hex: "#10b981", label: "Emerald" },
  { id: "teal",    hex: "#14b8a6", label: "Teal"    },
  { id: "cyan",    hex: "#06b6d4", label: "Cyan"    },
  { id: "lime",    hex: "#84cc16", label: "Lime"    },
  { id: "olive",   hex: "#65a30d", label: "Olive"   },
];

function getBadge(w) {
  if (w >= 7) return { label: "Active Learner", bg: "#dcfce7", color: "#15803d" };
  if (w >= 3) return { label: "On a Roll",      bg: "#d1fae5", color: "#047857" };
  return             { label: "Getting Started", bg: "#f0faf0", color: "#22c55e" };
}

function calcStreak(tasks) {
  const dates = new Set(tasks.filter(t => t.status === "completed" && t.completedAt).map(t => t.completedAt.split("T")[0]));
  let streak = 0, d = new Date(); d.setHours(0,0,0,0);
  while (dates.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate()-1); }
  return streak;
}

function calcWeekly(tasks) {
  const now = new Date(), dow = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate()-((dow+6)%7)); mon.setHours(0,0,0,0);
  return tasks.filter(t => t.status==="completed" && t.completedAt && new Date(t.completedAt)>=mon).length;
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="profile-toast">
      <span className="material-symbols-outlined" style={{ fontSize:16, color:"#22c55e" }}>check_circle</span>
      {message}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="profile-toggle" style={{ background: checked ? "#22c55e" : "#d1d5db", transition:"background 200ms" }}>
      <span className="profile-toggle-knob" style={{ transform: checked ? "translateX(16px)" : "translateX(2px)" }} />
    </button>
  );
}

function MenuRow({ icon, label, onClick, rightElement, red }) {
  return (
    <button className="profile-menu-row" onClick={onClick} style={red ? { color:"#dc2626" } : {}}>
      <span className="material-symbols-outlined" style={{ fontSize:18, color: red?"#dc2626":"#22c55e", flexShrink:0 }}>{icon}</span>
      <span className="profile-menu-label" style={red ? { color:"#dc2626" } : {}}>{label}</span>
      <span style={{ marginLeft:"auto" }}>
        {rightElement ?? <span className="material-symbols-outlined" style={{ fontSize:16, color:"#5a7a5a", opacity:0.6 }}>chevron_right</span>}
      </span>
    </button>
  );
}

export default function ProfilePanel() {
  const { user, logout, photoURL: authPhotoURL } = useAuth();
  const { isOpen, close } = useProfilePanel();
  const navigate = useNavigate();

  const [tasks, setTasks]       = useState([]);
  const [userDoc, setUserDoc]   = useState({});
  const [prefs, setPrefs]       = useState({ dueDateReminders:true, focusAlerts:false, weeklySummary:true });
  const [emailPrefs, setEmailPrefs] = useState({
    taskComplete:     true,
    overdueReminder:  true,
    weeklyDigest:     true,
    streakMilestone:  true,
    securityAlerts:   true,   // always on — locked
  });

  const [view, setView]                     = useState("menu");
  const [avatarColour, setAvatarColour]     = useState("green");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [saving, setSaving]                 = useState(false);
  const [signingOut, setSigningOut]         = useState(false);
  const [toast, setToast]                   = useState(null);
  const [notifExpanded, setNotifExpanded]   = useState(false);
  const [emailExpanded, setEmailExpanded]   = useState(false);
  const [changePassExpanded, setChangePassExpanded] = useState(false);

  /* ── Photo upload states ── */
  const [photoFile, setPhotoFile]       = useState(null);   // File object
  const [photoPreview, setPhotoPreview] = useState(null);   // local blob URL
  const [removePhoto, setRemovePhoto]   = useState(false);  // user wants to clear photo
  const fileInputRef = useRef(null);

  const [animState, setAnimState] = useState("closed");
  const panelRef = useRef(null);

  /* ── Animation ── */
  useEffect(() => {
    if (isOpen) {
      setAnimState("opening");
      const t = setTimeout(() => setAnimState("open"), 10);
      return () => clearTimeout(t);
    } else if (animState === "open" || animState === "opening") {
      setAnimState("closing");
      const t = setTimeout(() => setAnimState("closed"), 310);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // eslint-disable-line

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => { setView("menu"); setNotifExpanded(false); setEmailExpanded(false); setChangePassExpanded(false); }, 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) close(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [isOpen, close]);

  /* ── Firestore ── */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), snap => {
      const data = snap.data() || {};
      setUserDoc(data);
      setAvatarColour(data.avatarColour || "green");
      setDisplayNameInput(user.displayName || "");
      if (data.preferences) setPrefs(p => ({ ...p, ...data.preferences }));
      if (data.emailPrefs)  setEmailPrefs(p => ({ ...p, ...data.emailPrefs }));
    });
  }, [user]);

  /* ── Cleanup blob URLs ── */
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  /* ── Computed ── */
  const total    = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const streak   = calcStreak(tasks);
  const badge    = getBadge(calcWeekly(tasks));
  const displayName     = userDoc.displayName || user?.displayName || user?.email?.split("@")[0] || "Student";
  const email           = user?.email || "";
  const initials        = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarBg        = AVATAR_COLOURS.find(c => c.id === avatarColour)?.hex || "#22c55e";
  // authPhotoURL already merges Firestore photoURL > Auth photoURL (set in AuthContext)
  const currentPhotoURL = authPhotoURL;
  const editPhotoSrc    = photoPreview || (removePhoto ? null : currentPhotoURL);

  /* ── Handle file pick ── */
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setToast("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setToast("Image must be under 5 MB"); return; }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
    // reset input so same file can be reselected
    e.target.value = "";
  };

  /* ── Save profile ── */
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoURL = currentPhotoURL;

      if (photoFile) {
        // Convert to compressed base64 — stored in Firestore, no Storage bucket needed
        photoURL = await resizeImageToBase64(photoFile);
      } else if (removePhoto) {
        photoURL = null;
      }

      // Only update displayName in Firebase Auth.
      // base64 photoURL is too long for Auth — stored in Firestore only.
      await updateProfile(auth.currentUser, { displayName: displayNameInput });
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayNameInput, avatarColour,
        photoURL: photoURL || null, email,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setPhotoFile(null); setPhotoPreview(null); setRemovePhoto(false);
      setToast("Profile updated ✓");
      setView("menu");
    } catch (err) {
      console.error("Save error:", err);
      setToast("Error saving — try again");
    } finally {
      setSaving(false);
    }
  };

  const savePref = useCallback(async (key, value) => {
    if (!user) return;
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try { await setDoc(doc(db, "users", user.uid), { preferences: newPrefs }, { merge: true }); }
    catch (err) { console.error(err); }
  }, [user, prefs]);

  const saveEmailPref = useCallback(async (key, value) => {
    if (!user || key === "securityAlerts") return; // securityAlerts is always on
    const newPrefs = { ...emailPrefs, [key]: value };
    setEmailPrefs(newPrefs);
    try { await setDoc(doc(db, "users", user.uid), { emailPrefs: newPrefs }, { merge: true }); }
    catch (err) { console.error(err); }
  }, [user, emailPrefs]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await new Promise(r => setTimeout(r, 2000));
    try { await logout(); navigate("/"); }
    catch (err) { console.error(err); setSigningOut(false); }
  };

  if (animState === "closed") return null;
  const isAnimIn  = animState === "opening" || animState === "open";
  const isAnimOut = animState === "closing";

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div ref={panelRef} id="profile-panel" className="profile-panel"
        style={{
          opacity:   isAnimOut ? 0 : isAnimIn ? 1 : 0,
          transform: isAnimOut ? "translateY(-12px) scale(0.97)" : isAnimIn ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
          transition: "opacity 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── HEADER ── */}
        <div className="profile-header">
          <div className="profile-avatar-lg" style={{ background: currentPhotoURL ? "transparent" : avatarBg, padding:0, overflow:"hidden" }}>
            {currentPhotoURL
              ? <img src={currentPhotoURL} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
              : (initials || "S")}
          </div>
          <p className="profile-name">{displayName}</p>
          <p className="profile-email">{email}</p>
          <span className="profile-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
        </div>

        {/* ── STATS ── */}
        <div className="profile-stats-row">
          <div className="profile-stat"><span className="profile-stat-num">{total}</span><span className="profile-stat-label">Total Tasks</span></div>
          <div className="profile-stat-divider" />
          <div className="profile-stat"><span className="profile-stat-num">{completed}</span><span className="profile-stat-label">Completed</span></div>
          <div className="profile-stat-divider" />
          <div className="profile-stat"><span className="profile-stat-num">{streak}</span><span className="profile-stat-label">Day Streak</span></div>
        </div>

        {/* ── BODY ── */}
        <div className="profile-body">

          {/* ═══ MENU VIEW ═══ */}
          <div className="profile-view" style={{
            opacity: view==="menu"?1:0, transform: view==="menu"?"translateY(0)":"translateY(-8px)",
            pointerEvents: view==="menu"?"auto":"none",
            position: view==="editProfile"?"absolute":"relative", width:"100%",
            transition:"opacity 150ms ease, transform 150ms ease",
          }}>
            <p className="profile-section-label">ACCOUNT</p>
            <MenuRow icon="manage_accounts" label="Edit Profile"
              onClick={() => { setDisplayNameInput(displayName); setPhotoFile(null); setPhotoPreview(null); setRemovePhoto(false); setView("editProfile"); }} />
            <MenuRow icon="lock" label="Change Password"
              onClick={() => setChangePassExpanded(v => !v)}
              rightElement={<span className="material-symbols-outlined" style={{ fontSize:16, color:"#5a7a5a", opacity:0.6 }}>{changePassExpanded?"expand_less":"expand_more"}</span>} />
            {changePassExpanded && (
              <div className="profile-expand-section animate-fade-in">
                <p style={{ fontSize:12, color:"#5a7a5a", lineHeight:1.5 }}>A reset email will be sent to <strong>{email}</strong>.</p>
                <button className="profile-btn-green" onClick={async () => {
                  const { sendPasswordResetEmail } = await import("firebase/auth");
                  await sendPasswordResetEmail(auth, email);
                  // Trigger 4 — Security alert (always sent, cannot be disabled)
                  sendSecurityEmail({
                    email,
                    changeDateTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
                  });
                  setToast("Reset email sent ✓"); setChangePassExpanded(false);
                }}>Send Reset Email</button>
              </div>
            )}

            <p className="profile-section-label" style={{ marginTop:8 }}>PREFERENCES</p>
            <MenuRow icon="settings" label="Settings" onClick={() => { close(); navigate("/dashboard"); }} />
            <MenuRow icon="notifications" label="Notifications"
              onClick={() => setNotifExpanded(v => !v)}
              rightElement={<span className="material-symbols-outlined" style={{ fontSize:16, color:"#5a7a5a", opacity:0.6 }}>{notifExpanded?"expand_less":"expand_more"}</span>} />
            {notifExpanded && (
              <div className="profile-expand-section animate-fade-in">
                <div className="profile-toggle-row"><span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Due Date Reminders</span><Toggle checked={prefs.dueDateReminders} onChange={v=>savePref("dueDateReminders",v)} /></div>
                <div className="profile-toggle-row"><span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Focus Session Alerts</span><Toggle checked={prefs.focusAlerts} onChange={v=>savePref("focusAlerts",v)} /></div>
                <div className="profile-toggle-row"><span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Weekly Summary</span><Toggle checked={prefs.weeklySummary} onChange={v=>savePref("weeklySummary",v)} /></div>
              </div>
            )}

            {/* ── Email Notifications ── */}
            <MenuRow icon="mail" label="Email Notifications"
              onClick={() => setEmailExpanded(v => !v)}
              rightElement={<span className="material-symbols-outlined" style={{ fontSize:16, color:"#5a7a5a", opacity:0.6 }}>{emailExpanded?"expand_less":"expand_more"}</span>} />
            {emailExpanded && (
              <div className="profile-expand-section animate-fade-in">
                <p style={{ fontSize:11, color:"#5a7a5a", marginBottom:10, lineHeight:1.5 }}>
                  Choose which emails StudySync sends to <strong>{email}</strong>.
                </p>

                {/* Task completion digest */}
                <div className="profile-toggle-row">
                  <span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Task Completion Digest</span>
                  <Toggle checked={emailPrefs.taskComplete} onChange={v => saveEmailPref("taskComplete", v)} />
                </div>

                {/* Overdue reminders */}
                <div className="profile-toggle-row">
                  <span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Overdue Reminders</span>
                  <Toggle checked={emailPrefs.overdueReminder} onChange={v => saveEmailPref("overdueReminder", v)} />
                </div>

                {/* Weekly digest */}
                <div className="profile-toggle-row">
                  <span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Weekly Digest</span>
                  <Toggle checked={emailPrefs.weeklyDigest} onChange={v => saveEmailPref("weeklyDigest", v)} />
                </div>

                {/* Streak milestones */}
                <div className="profile-toggle-row">
                  <span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>Streak Milestones</span>
                  <Toggle checked={emailPrefs.streakMilestone} onChange={v => saveEmailPref("streakMilestone", v)} />
                </div>

                {/* Security alerts — always on */}
                <div className="profile-toggle-row" style={{ opacity:0.65 }}>
                  <span style={{ fontSize:12, color:"#1a2e1a", fontWeight:500 }}>
                    Security Alerts
                    <span style={{ fontSize:10, color:"#5a7a5a", display:"block", fontWeight:400 }}>Always on for your safety</span>
                  </span>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
              </div>
            )}

            <div className="profile-divider" />
            <button id="profile-signout-btn" className="profile-menu-row profile-signout" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? (
                <><span className="material-symbols-outlined profile-spin" style={{ fontSize:18, color:"#dc2626" }}>progress_activity</span><span style={{ fontSize:13, fontWeight:600, color:"#dc2626" }}>Signing out…</span></>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize:18, color:"#dc2626" }}>logout</span><span style={{ fontSize:13, fontWeight:600, color:"#dc2626" }}>Sign Out</span></>
              )}
            </button>
          </div>

          {/* ═══ EDIT PROFILE VIEW ═══ */}
          <div className="profile-view" style={{
            opacity: view==="editProfile"?1:0, transform: view==="editProfile"?"translateY(0)":"translateY(8px)",
            pointerEvents: view==="editProfile"?"auto":"none",
            position: view==="menu"?"absolute":"relative", width:"100%",
            transition:"opacity 200ms ease 50ms, transform 200ms ease 50ms",
            padding:"14px 16px 16px",
          }}>
            {/* Back */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <button className="profile-back-btn" onClick={() => setView("menu")}>
                <span className="material-symbols-outlined" style={{ fontSize:18 }}>arrow_back</span>
              </button>
              <span style={{ fontSize:13, fontWeight:700, color:"#1a2e1a" }}>Edit Profile</span>
            </div>

            {/* ── Photo upload area ── */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:16, gap:8 }}>
              {/* Clickable avatar */}
              <div className="profile-avatar-upload"
                style={{ background: editPhotoSrc ? "transparent" : avatarBg }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {editPhotoSrc
                  ? <img src={editPhotoSrc} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                  : <span style={{ fontSize:22, fontWeight:800, color:"#fff" }}>
                      {(displayNameInput||"S").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                    </span>}
                <div className="profile-avatar-camera-overlay">
                  <span className="material-symbols-outlined" style={{ fontSize:22, color:"#fff" }}>photo_camera</span>
                </div>
              </div>

              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" accept="image/*"
                style={{ display:"none" }} onChange={handlePhotoSelect} />

              {/* Links */}
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <button className="profile-photo-link" onClick={() => fileInputRef.current?.click()}>
                  {editPhotoSrc ? "Change photo" : "Upload photo"}
                </button>
                {(editPhotoSrc) && (
                  <>
                    <span style={{ color:"#d1d5db", fontSize:10 }}>•</span>
                    <button className="profile-photo-link profile-photo-link-red" onClick={() => {
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoFile(null); setPhotoPreview(null); setRemovePhoto(true);
                    }}>Remove</button>
                  </>
                )}
              </div>
              <p style={{ fontSize:10, color:"#5a7a5a", textAlign:"center", margin:0 }}>
                JPG, PNG or WebP · max 5 MB
              </p>
            </div>

            {/* Name */}
            <label className="profile-field-label">Display Name</label>
            <input className="profile-input" value={displayNameInput}
              onChange={e => setDisplayNameInput(e.target.value)} placeholder="Your name" maxLength={40} />

            {/* Colour picker — only shown when no photo is uploaded */}
            {!editPhotoSrc && (
              <>
                <label className="profile-field-label" style={{ marginTop:14 }}>Avatar Colour</label>
                <div className="profile-swatches">
                  {AVATAR_COLOURS.map(c => (
                    <button key={c.id} title={c.label} onClick={() => setAvatarColour(c.id)}
                      className="profile-swatch"
                      style={{ background:c.hex, outline: avatarColour===c.id?`3px solid ${c.hex}`:"none", outlineOffset:2, boxShadow: avatarColour===c.id?`0 0 0 5px ${c.hex}22`:"none" }}>
                      {avatarColour===c.id && <span className="material-symbols-outlined" style={{ fontSize:14, color:"#fff" }}>check</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Save / Cancel */}
            <div style={{ display:"flex", gap:8, marginTop:18 }}>
              <button className="profile-btn-green" style={{ flex:1 }}
                onClick={saveProfile} disabled={saving || !displayNameInput.trim()}>
                {saving
                  ? <span className="material-symbols-outlined profile-spin" style={{ fontSize:16 }}>progress_activity</span>
                  : "Save Changes"}
              </button>
              <button className="profile-btn-grey" onClick={() => setView("menu")} disabled={saving}>Cancel</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
