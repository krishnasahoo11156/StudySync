import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

/* ═══════════════════════════════════════════
   DARK MODE TOGGLE — pill-shaped toggle button
   48×26px pill with sliding thumb + icon
   Used in TopBar and ProfilePanel
═══════════════════════════════════════════ */
export default function DarkModeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <button
      id="dark-mode-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => toggleTheme(user?.uid)}
      className={`relative inline-flex items-center flex-shrink-0 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        transition-colors duration-200 ease-in-out rounded-full
        ${isDark
          ? "bg-primary/80 shadow-[0_0_8px_rgba(74,222,128,0.25)]"
          : "bg-stone-200 dark:bg-dm-surface-hover"
        }
        w-12 h-6 ${className}`}
    >
      {/* Track label icons */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center"
        aria-hidden="true"
      >
        {/* Moon — left side (dark) */}
        <span
          className={`absolute left-1 text-[11px] transition-opacity duration-200 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        >
          🌙
        </span>
        {/* Sun — right side (light) */}
        <span
          className={`absolute right-1 text-[11px] transition-opacity duration-200 ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
        >
          ☀️
        </span>
      </span>

      {/* Thumb */}
      <span
        className="pointer-events-none absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md
          transition-transform duration-200 ease-in-out"
        style={{
          left: 2,
          transform: isDark ? "translateX(24px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}
