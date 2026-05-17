import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { db, ref, push, onValue, query, limitToLast, serverTimestamp } from "../../lib/firebase";
import { getInitials, relativeTime } from "../../lib/roomUtils";

const MAX_LEN = 200;

export default function ChatPanel({ roomId, currentUid, currentName }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const [, forceRerender] = useState(0);

  // Relative time ticks
  useEffect(() => {
    const id = setInterval(() => forceRerender(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to last 20 messages only when panel open
  useEffect(() => {
    if (!open) return;
    const chatQuery = query(ref(db, `rooms/${roomId}/chat`), limitToLast(20));
    const unsub = onValue(chatQuery, snap => {
      const data = [];
      snap.forEach(child => data.push({ key: child.key, ...child.val() }));
      setMessages(data);
    });
    return () => unsub();
  }, [open, roomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim().slice(0, MAX_LEN);
    if (!text) return;
    setSending(true);
    setInput("");
    try {
      await push(ref(db, `rooms/${roomId}/chat`), {
        uid: currentUid,
        name: currentName,
        text,
        sentAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Chat] Send error:", e);
    } finally {
      setSending(false);
    }
  };

  const cardBg = isDark ? "var(--card-bg)" : "#fff";
  const border = isDark ? "1px solid var(--divider)" : "1px solid #e4edea";
  const textPrimary = isDark ? "var(--text-primary)" : "#1a2621";
  const textSecondary = isDark ? "var(--text-secondary)" : "#6b7280";
  const charsLeft = MAX_LEN - input.length;

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-in" style={{ background: cardBg, border }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-all"
        style={{ background: "transparent", color: textPrimary }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl" style={{ color: "var(--accent)", fontVariationSettings: "'FILL' 1" }}>chat</span>
          <span className="font-bold text-sm">Chat</span>
          {messages.length > 0 && !open && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: isDark ? "rgba(61,181,106,0.2)" : "#dcfce7", color: isDark ? "var(--accent)" : "#15803d" }}>
              {messages.length}
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-base" style={{ color: textSecondary }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4">
          {/* Session-only notice */}
          <p className="text-[11px] px-3 py-2 rounded-lg mb-3 text-center"
            style={{ background: isDark ? "rgba(245,158,11,0.1)" : "#fef9c3", color: isDark ? "#fde68a" : "#92400e" }}>
            💬 Chat is session-only and won't persist after you leave.
          </p>

          {/* Messages */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 scroll-on-hover mb-3">
            {messages.length === 0 ? (
              <p className="text-center text-xs py-8" style={{ color: textSecondary }}>
                No messages yet. Say hi! 👋
              </p>
            ) : (
              messages.map(msg => {
                const isMine = msg.uid === currentUid;
                return (
                  <div key={msg.key} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "var(--accent)", fontSize: 10 }}>
                        {getInitials(msg.name)}
                      </div>
                    )}
                    <div className="max-w-[75%]">
                      {!isMine && (
                        <p className="text-[10px] font-semibold mb-0.5 px-1" style={{ color: textSecondary }}>{msg.name}</p>
                      )}
                      <div className="px-3 py-2 rounded-2xl text-sm leading-snug"
                        style={isMine
                          ? { background: isDark ? "rgba(61,181,106,0.25)" : "#dcfce7", color: isDark ? "#a7f3c0" : "#14532d", borderBottomRightRadius: 4 }
                          : { background: isDark ? "rgba(255,255,255,0.07)" : "#f3f4f6", color: textPrimary, borderBottomLeftRadius: 4 }}>
                        {msg.text}
                      </div>
                      <p className={`text-[10px] mt-0.5 px-1 ${isMine ? "text-right" : ""}`} style={{ color: textSecondary }}>
                        {relativeTime(msg.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                aria-label="Type a message"
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_LEN))}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message…"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: isDark ? "var(--input-bg)" : "#f9fafb",
                  border: `1px solid ${isDark ? "var(--input-border)" : "#e5e7eb"}`,
                  color: textPrimary,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              {input.length > 160 && (
                <span className="absolute right-2 bottom-2 text-[10px] font-semibold"
                  style={{ color: charsLeft < 20 ? "#ef4444" : textSecondary }}>
                  {charsLeft}
                </span>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex-shrink-0"
              style={{
                background: input.trim() ? "var(--accent)" : "#9ca3af",
                cursor: input.trim() ? "pointer" : "not-allowed",
              }}>
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
