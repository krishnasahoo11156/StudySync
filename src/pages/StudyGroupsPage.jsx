/**
 * src/pages/StudyGroupsPage.jsx
 * Lobby page — Create or Join a collaborative study room.
 * Route: /groups
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { useTheme } from "../contexts/ThemeContext";
import {
  db,
  ref,
  set,
  get,
  serverTimestamp,
  onDisconnect,
  update,
  ensureAnonymousUser,
} from "../lib/firebase";
import { generateRoomCode } from "../lib/roomUtils";

export default function StudyGroupsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  /* ── Create form state ── */
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [copied, setCopied] = useState(false);

  /* ── Join form state ── */
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    document.title = "StudySync - Study Rooms";
  }, []);

  /* ─────────────────────────── CREATE ROOM ─────────────────────────── */
  const handleCreate = async () => {
    if (!createName.trim()) { setCreateError("Enter your name to continue."); return; }
    setCreating(true);
    setCreateError("");
    try {
      const user = await ensureAnonymousUser();
      const code = generateRoomCode();
      const roomRef = ref(db, `rooms/${code}`);

      await set(roomRef, {
        meta: {
          hostUid: user.uid,
          createdAt: serverTimestamp(),
          dissolved: false,
        },
        timer: {
          mode: "focus",
          durationSeconds: 1500,
          startedAt: null,
          pausedAt: null,
          pausedElapsed: 0,
          running: false,
          focusDuration: 1500,
          breakDuration: 300,
        },
        members: {
          [user.uid]: {
            displayName: createName.trim().slice(0, 20),
            status: "focusing",
            joinedAt: serverTimestamp(),
            online: true,
          },
        },
      });

      /* onDisconnect: mark host offline but do NOT dissolve */
      const memberRef = ref(db, `rooms/${code}/members/${user.uid}`);
      await onDisconnect(memberRef).update({ online: false, status: "away" });

      setCreatedCode(code);
      /* Navigate after brief share moment */
      setTimeout(() => navigate(`/room/${code}`), 100);
    } catch (err) {
      console.error("[StudyRooms] Create error:", err);
      setCreateError("Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  /* ─────────────────────────── JOIN ROOM ─────────────────────────── */
  const handleJoin = async () => {
    if (!joinName.trim()) { setJoinError("Enter your name to continue."); return; }
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setJoinError("Room code must be exactly 6 characters."); return; }
    setJoining(true);
    setJoinError("");
    try {
      const user = await ensureAnonymousUser();
      const roomSnap = await get(ref(db, `rooms/${code}`));
      if (!roomSnap.exists()) { setJoinError("No room with that code exists."); setJoining(false); return; }
      const roomData = roomSnap.val();
      if (roomData?.meta?.dissolved) { setJoinError("This session has ended."); setJoining(false); return; }

      const memberCount = Object.keys(roomData?.members || {}).length;

      const memberRef = ref(db, `rooms/${code}/members/${user.uid}`);
      await set(memberRef, {
        displayName: joinName.trim().slice(0, 20),
        status: "focusing",
        joinedAt: serverTimestamp(),
        online: true,
      });

      await onDisconnect(memberRef).update({ online: false, status: "away" });

      if (memberCount > 10) {
        /* soft warning stored in session, shown in room */
        sessionStorage.setItem("ss_room_large", "true");
      }

      navigate(`/room/${code}`);
    } catch (err) {
      console.error("[StudyRooms] Join error:", err);
      setJoinError("Could not join room. Check the code and try again.");
    } finally {
      setJoining(false);
    }
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─────────────────────────── CARD STYLES ─────────────────────────── */
  const cardStyle = isDark
    ? { background: "var(--card-bg)", border: "1px solid var(--divider)" }
    : { background: "#fff", border: "1px solid #e4edea", boxShadow: "0 4px 24px rgba(22,163,74,0.06)" };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: `1px solid ${isDark ? "var(--input-border)" : "#c8dac9"}`,
    background: isDark ? "var(--input-bg)" : "#fff",
    color: isDark ? "var(--text-primary)" : "#1a1a1a",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s ease",
  };

  return (
    <PageShell activePage="groups" title="Study Rooms" subtitle="Focus together in real time">
      <div className="animate-page-enter max-w-4xl mx-auto">

        {/* Hero */}
        <section
          className="mb-10 p-8 rounded-2xl relative overflow-hidden"
          style={isDark
            ? { background: "linear-gradient(135deg, #0d1f0e, #0a1a10)", border: "1px solid var(--divider)" }
            : { background: "linear-gradient(135deg, #f0fdf4, #f5f1e8)", border: "1px solid #d1fae5" }}
        >
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl signature-gradient flex items-center justify-center flex-shrink-0 shadow-lg animate-glow-pulse">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                groups
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: isDark ? "var(--text-primary)" : "#1a2621" }}>
                Collaborative Study Rooms
              </h1>
              <p className="text-sm" style={{ color: isDark ? "var(--text-secondary)" : "#4a5568" }}>
                Create or join a room to study with a friend — synced Pomodoro timer, presence & live chat.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full -mr-16 -mt-16 blur-3xl opacity-20" style={{ background: "var(--accent)" }} />
        </section>

        {/* Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── CREATE A ROOM ── */}
          <div className="rounded-2xl p-8 flex flex-col gap-5" style={cardStyle}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isDark ? "rgba(61,181,106,0.15)" : "#dcfce7" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent)", fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "var(--text-primary)" : "#1a2621" }}>Create a Room</h2>
                <p className="text-xs" style={{ color: isDark ? "var(--text-secondary)" : "#6b7280" }}>Start a session & invite a friend</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? "var(--text-secondary)" : "#4a5568" }}>
                Your Name
              </label>
              <input
                id="create-name-input"
                type="text"
                placeholder="E.g. Sam Johnson"
                maxLength={20}
                value={createName}
                onChange={e => { setCreateName(e.target.value); setCreateError(""); }}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                style={inputStyle}
              />
            </div>

            {createError && (
              <p className="text-xs font-semibold px-3 py-2 rounded-lg animate-fade-in"
                style={{ background: isDark ? "#2a1010" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" }}>
                {createError}
              </p>
            )}

            <button
              id="create-room-btn"
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: creating ? "#6b9978" : "var(--accent)",
                cursor: creating ? "not-allowed" : "pointer",
              }}
            >
              {creating
                ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Creating…</>
                : <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add</span> Start Room</>
              }
            </button>

            <p className="text-xs text-center" style={{ color: isDark ? "var(--text-secondary)" : "#9ca3af" }}>
              A 6-character code will be generated — share it with your study partner.
            </p>
          </div>

          {/* ── JOIN A ROOM ── */}
          <div className="rounded-2xl p-8 flex flex-col gap-5" style={cardStyle}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isDark ? "rgba(59,130,246,0.15)" : "#dbeafe" }}>
                <span className="material-symbols-outlined" style={{ color: "#3b82f6", fontVariationSettings: "'FILL' 1" }}>login</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "var(--text-primary)" : "#1a2621" }}>Join a Room</h2>
                <p className="text-xs" style={{ color: isDark ? "var(--text-secondary)" : "#6b7280" }}>Enter a code to join someone's session</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? "var(--text-secondary)" : "#4a5568" }}>
                Your Name
              </label>
              <input
                id="join-name-input"
                type="text"
                placeholder="E.g. Alex Kim"
                maxLength={20}
                value={joinName}
                onChange={e => { setJoinName(e.target.value); setJoinError(""); }}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? "var(--text-secondary)" : "#4a5568" }}>
                Room Code
              </label>
              <input
                id="join-code-input"
                type="text"
                placeholder="ABCD42"
                maxLength={6}
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setJoinError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                style={{
                  ...inputStyle,
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontSize: "18px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />
            </div>

            {joinError && (
              <p className="text-xs font-semibold px-3 py-2 rounded-lg animate-fade-in"
                style={{ background: isDark ? "#2a1010" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" }}>
                {joinError}
              </p>
            )}

            <button
              id="join-room-btn"
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: joining ? "#6b9978" : "#3b82f6",
                cursor: joining ? "not-allowed" : "pointer",
              }}
            >
              {joining
                ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Joining…</>
                : <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>login</span> Join Room</>
              }
            </button>

            <p className="text-xs text-center" style={{ color: isDark ? "var(--text-secondary)" : "#9ca3af" }}>
              Ask your study partner for their 6-character room code.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "timer", title: "Synced Timer", desc: "Server-driven Pomodoro — both users see the exact same countdown." },
            { icon: "group", title: "Presence & Status", desc: "See who's focusing, on break, or away in real time." },
            { icon: "chat", title: "Live Chat", desc: "Quick messages during breaks. Session-only, no history stored." },
          ].map(f => (
            <div key={f.icon} className="rounded-xl p-5 flex gap-4 items-start" style={isDark
              ? { background: "rgba(61,181,106,0.05)", border: "1px solid var(--divider)" }
              : { background: "#f0fdf4", border: "1px solid #d1fae5" }}>
              <span className="material-symbols-outlined text-2xl mt-0.5 flex-shrink-0" style={{ color: "var(--accent)", fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: isDark ? "var(--text-primary)" : "#1a2621" }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: isDark ? "var(--text-secondary)" : "#6b7280" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </PageShell>
  );
}
