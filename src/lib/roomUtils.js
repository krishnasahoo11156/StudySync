/**
 * src/lib/roomUtils.js
 * Utility functions for Study Room feature.
 */

/* ── Room code: 6-char uppercase alphanumeric, no ambiguous chars 0,O,I,1 ── */
const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return code;
}

/** Derive 1–2 character initials from a display name */
export function getInitials(name = "") {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/** Status config */
export const STATUS_CONFIG = {
  focusing: { label: "Focusing",  dot: "#3db56a", bg: "#dcfce7", text: "#15803d" },
  on_break: { label: "On Break",  dot: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  away:     { label: "Away",      dot: "#9ca3af", bg: "#f3f4f6", text: "#4b5563" },
};

/**
 * Format relative time (e.g. "2m ago", "just now")
 */
export function relativeTime(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Format mm:ss from milliseconds remaining
 */
export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Compute remaining milliseconds from a timer snapshot.
 * elapsed = (Date.now() - startedAt) + pausedElapsed
 * remaining = durationSeconds * 1000 - elapsed
 */
export function computeRemaining(timer) {
  if (!timer) return 0;
  const dur = (timer.durationSeconds || 1500) * 1000;
  const paused = timer.pausedElapsed || 0;
  if (!timer.running) {
    // Frozen at (duration - pausedElapsed)
    return Math.max(0, dur - paused);
  }
  const startedAt = timer.startedAt;
  if (!startedAt) return dur;
  const elapsed = Date.now() - startedAt + paused;
  return Math.max(0, dur - elapsed);
}

/** Duration options in minutes */
export const DURATION_OPTIONS = [10, 15, 25, 30, 45, 50];
