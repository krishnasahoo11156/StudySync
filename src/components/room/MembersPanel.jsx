import { useTheme } from "../../contexts/ThemeContext";
import { db, ref, update } from "../../lib/firebase";
import { getInitials, STATUS_CONFIG } from "../../lib/roomUtils";

export default function MembersPanel({ roomId, members = {}, hostUid, currentUid }) {
  const { isDark } = useTheme();
  const memberList = Object.entries(members).sort(([, a], [, b]) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const count = memberList.length;

  const cardBg = isDark ? "var(--card-bg)" : "#fff";
  const border = isDark ? "1px solid var(--divider)" : "1px solid #e4edea";
  const textPrimary = isDark ? "var(--text-primary)" : "#1a2621";
  const textSecondary = isDark ? "var(--text-secondary)" : "#6b7280";

  const handleStatusChange = async (status) => {
    if (!currentUid) return;
    await update(ref(db, `rooms/${roomId}/members/${currentUid}`), { status });
  };

  return (
    <div className="rounded-2xl p-6 mb-5 animate-fade-in" style={{ background: cardBg, border, boxShadow: "0 2px 12px rgba(22,163,74,0.04)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-xl" style={{ color: "var(--accent)", fontVariationSettings: "'FILL' 1" }}>group</span>
        <h3 className="font-bold text-sm" style={{ color: textPrimary }}>
          In this room
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: isDark ? "rgba(61,181,106,0.15)" : "#dcfce7", color: isDark ? "var(--accent)" : "#15803d" }}>
            {count}
          </span>
        </h3>
        {count > 10 && (
          <span className="ml-auto text-xs px-2 py-1 rounded-lg font-semibold"
            style={{ background: "#fef3c7", color: "#92400e" }}>
            ⚠ Large room
          </span>
        )}
      </div>

      {/* Member rows */}
      <div className="flex flex-col gap-2 mb-4">
        {memberList.map(([uid, member]) => {
          const cfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.away;
          const isHost = uid === hostUid;
          const isOffline = !member.online;
          return (
            <div key={uid} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0"}` }}>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                style={{ background: isOffline ? "#9ca3af" : "var(--accent)", opacity: isOffline ? 0.6 : 1 }}>
                {getInitials(member.displayName)}
              </div>
              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate" style={{ color: isOffline ? textSecondary : textPrimary }}>
                    {member.displayName || "Unknown"}
                  </span>
                  {isHost && (
                    <span className="text-sm" title="Host">👑</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isOffline ? "#6b7280" : cfg.dot }} />
                  <span className="text-xs" style={{ color: textSecondary }}>
                    {isOffline ? "(offline)" : cfg.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Own status dropdown */}
      <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0"}` }}>
        <span className="text-xs font-semibold" style={{ color: textSecondary }}>My status:</span>
        <select
          aria-label="Change your focus status"
          onChange={e => handleStatusChange(e.target.value)}
          defaultValue={members[currentUid]?.status || "focusing"}
          className="flex-1 text-xs font-bold rounded-lg px-3 py-1.5 border appearance-none cursor-pointer"
          style={{
            background: isDark ? "var(--input-bg)" : "#f9fafb",
            border: `1px solid ${isDark ? "var(--input-border)" : "#d1d5db"}`,
            color: textPrimary,
          }}>
          <option value="focusing">🟢 Focusing</option>
          <option value="on_break">🟡 On Break</option>
          <option value="away">⚪ Away</option>
        </select>
      </div>
    </div>
  );
}
