/**
 * src/pages/StudyRoomPage.jsx
 * Route: /room/:roomId
 * The main collaborative study room experience.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  db, ref, onValue, update, remove,
  ensureAnonymousUser,
} from "../lib/firebase";
import TimerCard from "../components/room/TimerCard";
import MembersPanel from "../components/room/MembersPanel";
import ChatPanel from "../components/room/ChatPanel";

/* ── Toast notification ── */
function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, []);
  const colors = { info: "#1D4ED8", success: "#15803d", warning: "#92400e", error: "#dc2626" };
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg animate-toast-in flex items-center gap-3"
      style={{ background: colors[type] || colors.info, maxWidth: 360 }}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

/* ── Connection banner ── */
function ConnectionBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[150] px-4 py-2 text-sm font-bold text-white flex items-center justify-center gap-2"
      style={{ background: "#dc2626" }}>
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      Reconnecting to Firebase…
    </div>
  );
}

export default function StudyRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  /* ── State ── */
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);
  const [currentName, setCurrentName] = useState("");
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(true);
  const [copied, setCopied] = useState(false);
  const dissolvedRedirectRef = useRef(false);

  /* ── Split Pane Resize State ── */
  const [leftWidth, setLeftWidth] = useState(() => {
    const cached = localStorage.getItem("ss_room_left_width");
    return cached ? parseFloat(cached) : 70;
  });

  const [topHeight, setTopHeight] = useState(() => {
    const cached = localStorage.getItem("ss_room_top_height");
    return cached ? parseFloat(cached) : 60;
  });

  const [draggingWidth, setDraggingWidth] = useState(false);
  const [draggingHeight, setDraggingHeight] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!draggingWidth) return;

    const handleMouseMove = (e) => {
      const newWidthPercent = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(30, Math.min(85, newWidthPercent));
      setLeftWidth(clamped);
      localStorage.setItem("ss_room_left_width", clamped.toString());
    };

    const handleMouseUp = () => {
      setDraggingWidth(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingWidth]);

  useEffect(() => {
    if (!draggingHeight) return;

    const handleMouseMove = (e) => {
      const headerHeight = 64;
      const leftPaneHeight = window.innerHeight - headerHeight;
      const relativeY = e.clientY - headerHeight;
      const newHeightPercent = (relativeY / leftPaneHeight) * 100;
      const clamped = Math.max(20, Math.min(80, newHeightPercent));
      setTopHeight(clamped);
      localStorage.setItem("ss_room_top_height", clamped.toString());
    };

    const handleMouseUp = () => {
      setDraggingHeight(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingHeight]);

  /* ── Add a toast ── */
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5500);
  }, []);

  /* ── Auth + subscribe ── */
  useEffect(() => {
    document.title = `StudySync — Room ${roomId}`;
    let unsubRoom = () => {};
    let unsubConn = () => {};

    const init = async () => {
      try {
        const user = await ensureAnonymousUser();
        setCurrentUid(user.uid);

        // Connection status
        unsubConn = onValue(ref(db, ".info/connected"), snap => {
          setConnected(!!snap.val());
        });

        // Main room subscription
        unsubRoom = onValue(ref(db, `rooms/${roomId}`), snap => {
          if (!snap.exists()) {
            setError("No room with that code exists.");
            setLoading(false);
            return;
          }
          const data = snap.val();

          // Dissolved → redirect members
          if (data?.meta?.dissolved && !dissolvedRedirectRef.current) {
            dissolvedRedirectRef.current = true;
            const hostUid = data?.meta?.hostUid;
            if (user.uid !== hostUid) {
              addToast("The host has ended this session.", "warning");
              setTimeout(() => navigate("/groups"), 3000);
            }
          }

          setRoom(data);
          setIsHost(data?.meta?.hostUid === user.uid);
          const name = data?.members?.[user.uid]?.displayName || "";
          setCurrentName(name);
          setLoading(false);

          // Large room warning
          const memberCount = Object.keys(data?.members || {}).length;
          if (sessionStorage.getItem("ss_room_large") === "true" && memberCount > 10) {
            sessionStorage.removeItem("ss_room_large");
            addToast("Large rooms may affect performance.", "warning");
          }
        });
      } catch (err) {
        console.error("[StudyRoom] init error:", err);
        setError("Could not connect to the room. Please refresh.");
        setLoading(false);
      }
    };

    init();
    return () => { unsubRoom(); unsubConn(); };
  }, [roomId]);

  /* ── Session end handler (host only) ── */
  const handleSessionEnd = useCallback(async () => {
    if (!isHost || !room?.timer) return;
    const t = room.timer;
    const timerRef = ref(db, `rooms/${roomId}/timer`);
    if (t.mode === "focus") {
      await update(timerRef, {
        mode: "break",
        durationSeconds: t.breakDuration || 300,
        running: false,
        startedAt: null,
        pausedAt: null,
        pausedElapsed: 0,
      });
      addToast("Focus session complete! Take a break ☕", "success");
    } else {
      await update(timerRef, {
        mode: "focus",
        durationSeconds: t.focusDuration || 1500,
        running: false,
        startedAt: null,
        pausedAt: null,
        pausedElapsed: 0,
      });
      addToast("Break over — back to focus! 🎯", "success");
    }
  }, [isHost, room, roomId]);

  /* ── Leave room (member) ── */
  const handleLeave = useCallback(async () => {
    if (!currentUid) return;
    try {
      await remove(ref(db, `rooms/${roomId}/members/${currentUid}`));
    } catch (e) { console.error(e); }
    navigate("/groups");
  }, [currentUid, roomId, navigate]);

  /* ── End room (host) ── */
  const handleEndRoom = useCallback(async () => {
    if (!isHost) return;
    try {
      await update(ref(db, `rooms/${roomId}/meta`), { dissolved: true });
      // Give members 3s to see the toast, then delete the room
      setTimeout(async () => {
        try { await remove(ref(db, `rooms/${roomId}`)); } catch (e) { console.error(e); }
        navigate("/groups");
      }, 3500);
    } catch (e) { console.error(e); }
  }, [isHost, roomId, navigate]);

  /* ── Copy code ── */
  const copyCode = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Styles ── */
  const pageBg = isDark ? "var(--page-bg)" : "#f5f9f5";
  const cardBg = isDark ? "var(--card-bg)" : "#fff";
  const border = isDark ? "1px solid var(--divider)" : "1px solid #e4edea";
  const textPrimary = isDark ? "var(--text-primary)" : "#1a2621";
  const textSecondary = isDark ? "var(--text-secondary)" : "#6b7280";

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl animate-spin" style={{ color: "var(--accent)" }}>progress_activity</span>
        <p className="mt-3 text-sm font-semibold" style={{ color: textSecondary }}>Connecting to room {roomId}…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
      <div className="text-center p-8 rounded-2xl max-w-sm" style={{ background: cardBg, border }}>
        <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: "#ef4444" }}>error</span>
        <p className="font-bold text-lg mb-2" style={{ color: textPrimary }}>{error}</p>
        <button onClick={() => navigate("/groups")}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}>
          Back to Lobby
        </button>
      </div>
    </div>
  );

  const members = room?.members || {};
  const timer = room?.timer || null;
  const hostUid = room?.meta?.hostUid;

  return (
    <div className="min-h-screen overflow-hidden flex flex-col" style={{ background: pageBg }}>
      {!connected && <ConnectionBanner />}

      {/* Toasts */}
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type}
          onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
      ))}

      {/* Resizing Overlays to capture mouse events smoothly */}
      {draggingWidth && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize select-none" />
      )}
      {draggingHeight && (
        <div className="fixed inset-0 z-[9999] cursor-row-resize select-none" />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between h-16 flex-shrink-0"
        style={{ background: isDark ? "rgba(13,31,20,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: border, height: "64px" }}>
        {/* Logo + room info */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg signature-gradient flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: textSecondary }}>Room</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg tracking-widest" style={{ color: textPrimary }}>{roomId}</span>
              <button onClick={copyCode} title="Copy room code"
                className="text-xs px-2 py-0.5 rounded-lg font-semibold transition-all"
                style={{ background: isDark ? "rgba(61,181,106,0.15)" : "#dcfce7", color: isDark ? "var(--accent)" : "#15803d" }}>
                {copied ? "✓" : "Copy 📋"}
              </button>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Inline theme toggle (no AuthContext dependency) */}
          <button
            onClick={() => toggleTheme()}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f4", border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#e4edea"}` }}>
            <span className="text-base">{isDark ? "🌙" : "☀️"}</span>
          </button>
          {isHost ? (
            <button onClick={handleEndRoom}
              className="px-3 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5"
              style={{ background: "#dc2626" }}>
              <span className="material-symbols-outlined text-base">meeting_room</span>
              <span className="hidden sm:inline">End Room</span>
            </button>
          ) : (
            <button onClick={handleLeave}
              className="px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f4", color: textPrimary }}>
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      {isDesktop ? (
        <div className="flex w-full overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
          {/* Left Workspace */}
          <div className="flex flex-col overflow-hidden min-w-0" style={{ width: `${leftWidth}%` }}>
            {/* Top Workspace (TimerCard) */}
            <div className="overflow-hidden min-h-0 p-4 pb-2" style={{ height: `${topHeight}%` }}>
              <TimerCard
                roomId={roomId}
                timer={timer}
                isHost={isHost}
                onSessionEnd={handleSessionEnd}
                fullHeight={true}
              />
            </div>

            {/* Horizontal Splitter */}
            <div
              onMouseDown={() => setDraggingHeight(true)}
              className="h-1.5 w-full cursor-row-resize flex-shrink-0 transition-colors duration-200 relative group"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#e4edea" }}
            >
              <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-[var(--accent)] opacity-40 transition-colors duration-200" />
            </div>

            {/* Bottom Workspace (MembersPanel) */}
            <div className="flex-1 overflow-hidden min-h-0 p-4 pt-2">
              <MembersPanel
                roomId={roomId}
                members={members}
                hostUid={hostUid}
                currentUid={currentUid}
                fullHeight={true}
              />
            </div>
          </div>

          {/* Vertical Splitter */}
          <div
            onMouseDown={() => setDraggingWidth(true)}
            className="w-1.5 h-full cursor-col-resize flex-shrink-0 transition-colors duration-200 relative group"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#e4edea" }}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-[var(--accent)] opacity-40 transition-colors duration-200" />
          </div>

          {/* Right Workspace (ChatPanel) */}
          <div className="flex-1 overflow-hidden min-w-0 p-4 pl-2">
            <ChatPanel
              roomId={roomId}
              currentUid={currentUid}
              currentName={currentName}
              fullHeight={true}
            />
          </div>
        </div>
      ) : (
        /* Mobile Stacked Layout */
        <main className="max-w-[680px] mx-auto px-4 py-6 pb-16 overflow-y-auto flex-1">
          {/* Mobile room code */}
          <div className="sm:hidden mb-4 flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: textSecondary }}>Room:</span>
            <span className="font-mono font-bold tracking-widest" style={{ color: textPrimary }}>{roomId}</span>
            <button onClick={copyCode} className="text-xs px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: isDark ? "rgba(61,181,106,0.15)" : "#dcfce7", color: isDark ? "var(--accent)" : "#15803d" }}>
              {copied ? "✓" : "Copy"}
            </button>
          </div>

          <TimerCard
            roomId={roomId}
            timer={timer}
            isHost={isHost}
            onSessionEnd={handleSessionEnd}
            fullHeight={false}
          />

          <MembersPanel
            roomId={roomId}
            members={members}
            hostUid={hostUid}
            currentUid={currentUid}
            fullHeight={false}
          />

          <ChatPanel
            roomId={roomId}
            currentUid={currentUid}
            currentName={currentName}
            fullHeight={false}
          />
        </main>
      )}
    </div>
  );
}
