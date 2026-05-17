import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { db, ref, update, serverTimestamp } from "../../lib/firebase";
import { computeRemaining, formatCountdown, DURATION_OPTIONS } from "../../lib/roomUtils";

const ARC_R = 88;
const ARC_C = 100;
const ARC_CIRCUM = 2 * Math.PI * ARC_R;

export default function TimerCard({ roomId, timer, isHost, onSessionEnd }) {
  const { isDark } = useTheme();
  const timerRef = ref(db, `rooms/${roomId}/timer`);

  const [remaining, setRemaining] = useState(() => computeRemaining(timer));
  const intervalRef = useRef(null);
  const lastMinuteRef = useRef(null);
  const srRef = useRef(null);

  const endHandledRef = useRef(false);

  // Re-tick whenever timer snapshot changes
  useEffect(() => {
    endHandledRef.current = false;
    clearInterval(intervalRef.current);

    const tick = () => {
      const rem = computeRemaining(timer);
      setRemaining(rem);

      // Screen reader: announce every full minute
      const min = Math.floor(rem / 60000);
      if (min !== lastMinuteRef.current && rem > 0) {
        lastMinuteRef.current = min;
        if (srRef.current) srRef.current.textContent = `${min} minute${min !== 1 ? "s" : ""} remaining`;
      }

      // Session end
      if (rem <= 0 && !endHandledRef.current) {
        endHandledRef.current = true;
        clearInterval(intervalRef.current);
        if (isHost) onSessionEnd();
      }
    };

    tick();
    if (timer?.running) {
      intervalRef.current = setInterval(tick, 100);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer]);

  const progress = timer ? Math.max(0, Math.min(1, remaining / ((timer.durationSeconds || 1500) * 1000))) : 1;
  const strokeDash = progress * ARC_CIRCUM;

  const isFocus = timer?.mode !== "break";

  // ── Host actions ──
  const handleStart = useCallback(async () => {
    await update(timerRef, { running: true, startedAt: serverTimestamp(), pausedAt: null, pausedElapsed: 0 });
  }, [roomId]);

  const handlePause = useCallback(async () => {
    const elapsed = Date.now() - (timer?.startedAt || Date.now()) + (timer?.pausedElapsed || 0);
    await update(timerRef, { running: false, pausedAt: serverTimestamp(), pausedElapsed: elapsed });
  }, [timer, roomId]);

  const handleResume = useCallback(async () => {
    await update(timerRef, { running: true, startedAt: serverTimestamp(), pausedAt: null });
  }, [roomId]);

  const handleReset = useCallback(async () => {
    await update(timerRef, { running: false, startedAt: null, pausedAt: null, pausedElapsed: 0 });
  }, [roomId]);

  const handleDurationChange = useCallback(async (type, mins) => {
    if (timer?.running) return;
    const secs = mins * 60;
    const patch = type === "focus"
      ? { focusDuration: secs, ...(timer?.mode === "focus" ? { durationSeconds: secs, pausedElapsed: 0 } : {}) }
      : { breakDuration: secs, ...(timer?.mode === "break" ? { durationSeconds: secs, pausedElapsed: 0 } : {}) };
    await update(timerRef, patch);
  }, [timer, roomId]);

  const cardBg = isDark ? "var(--card-bg)" : "#fff";
  const border = isDark ? "1px solid var(--divider)" : "1px solid #e4edea";
  const textPrimary = isDark ? "var(--text-primary)" : "#1a2621";
  const textSecondary = isDark ? "var(--text-secondary)" : "#6b7280";
  const accent = "var(--accent)";
  const disabled = !isHost || timer?.running;

  return (
    <div className="rounded-2xl p-6 mb-5 animate-fade-in" style={{ background: cardBg, border, boxShadow: "0 4px 24px rgba(22,163,74,0.06)" }}>
      {/* Mode pill */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={isFocus
            ? { background: isDark ? "var(--badge-pill-bg)" : "#dcfce7", color: isDark ? "var(--badge-pill-text)" : "#15803d" }
            : { background: isDark ? "#78350f" : "#fef3c7", color: isDark ? "#fde68a" : "#92400e" }}>
          {isFocus ? "🎯 Focus Session" : "☕ Break Time"}
        </span>
        {!isHost && (
          <span className="text-[11px] px-2 py-1 rounded-lg" style={{ background: isDark ? "rgba(0,0,0,0.3)" : "#f1f5f4", color: textSecondary }}>
            Host controls timer
          </span>
        )}
      </div>

      {/* SVG Arc + Countdown */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg width={200} height={200} viewBox="0 0 200 200" className="timer-ring-glow" style={{ transform: "rotate(-90deg)" }}>
            {/* Track */}
            <circle cx={ARC_C} cy={ARC_C} r={ARC_R} fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "#e4edea"} strokeWidth={8} />
            {/* Progress */}
            <circle cx={ARC_C} cy={ARC_C} r={ARC_R} fill="none"
              stroke={isFocus ? accent : "#f59e0b"}
              strokeWidth={8} strokeLinecap="round"
              strokeDasharray={ARC_CIRCUM}
              strokeDashoffset={ARC_CIRCUM - strokeDash}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono font-semibold" style={{ fontSize: 52, color: textPrimary, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {formatCountdown(remaining)}
            </span>
            <span className="text-xs mt-1 font-semibold uppercase tracking-widest" style={{ color: textSecondary }}>
              {timer?.running ? "running" : remaining > 0 ? "paused" : "done"}
            </span>
          </div>
        </div>

        {/* SR live region */}
        <span ref={srRef} aria-live="polite" className="sr-only" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-5" title={!isHost ? "Only the host can control the timer" : ""}>
        {/* Start / Pause / Resume */}
        {!timer?.running && remaining > 0 && (
          <button id="timer-start-btn" aria-label={timer?.pausedElapsed > 0 ? "Resume focus timer" : "Start focus timer"}
            onClick={isHost ? (timer?.pausedElapsed > 0 ? handleResume : handleStart) : undefined}
            disabled={!isHost}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: isHost ? accent : "#9ca3af", cursor: isHost ? "pointer" : "not-allowed", opacity: isHost ? 1 : 0.6 }}>
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {timer?.pausedElapsed > 0 ? "play_arrow" : "play_circle"}
            </span>
            {timer?.pausedElapsed > 0 ? "Resume" : "Start"}
          </button>
        )}
        {timer?.running && (
          <button id="timer-pause-btn" aria-label="Pause timer"
            onClick={isHost ? handlePause : undefined}
            disabled={!isHost}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: isHost ? "#f59e0b" : "#9ca3af", cursor: isHost ? "pointer" : "not-allowed", opacity: isHost ? 1 : 0.6 }}>
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
            Pause
          </button>
        )}
        <button id="timer-reset-btn" aria-label="Reset timer"
          onClick={isHost ? handleReset : undefined}
          disabled={!isHost}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f4",
            color: isHost ? textPrimary : "#9ca3af",
            cursor: isHost ? "pointer" : "not-allowed",
            opacity: isHost ? 1 : 0.6,
          }}>
          <span className="material-symbols-outlined text-base">restart_alt</span>
          Reset
        </button>
      </div>

      {/* Duration dropdowns — host only, when not running */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {[
          { label: "Focus", key: "focus", current: Math.round((timer?.focusDuration || 1500) / 60) },
          { label: "Break", key: "break", current: Math.round((timer?.breakDuration || 300) / 60) },
        ].map(({ label, key, current }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: textSecondary }}>{label}:</span>
            <select
              aria-label={`Set ${label.toLowerCase()} duration`}
              value={current}
              disabled={disabled}
              onChange={e => handleDurationChange(key, Number(e.target.value))}
              className="text-xs font-bold rounded-lg px-2 py-1 border appearance-none cursor-pointer"
              style={{
                background: isDark ? "var(--input-bg)" : "#f9fafb",
                border: `1px solid ${isDark ? "var(--input-border)" : "#d1d5db"}`,
                color: disabled ? "#9ca3af" : textPrimary,
                cursor: disabled ? "not-allowed" : "pointer",
              }}>
              {DURATION_OPTIONS.map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
