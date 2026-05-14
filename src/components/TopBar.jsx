import { useAuth } from "../contexts/AuthContext";
import { useProfilePanel } from "../contexts/ProfilePanelContext";
import DarkModeToggle from "./DarkModeToggle";

/* ═══════════════════════════════════════════
   TOP BAR — unified header for every page
   Glass effect, slim 56px, seamless with sidebar
═══════════════════════════════════════════ */
export default function TopBar({ title, subtitle, children }) {
  const { user, photoURL } = useAuth();
  const { toggle } = useProfilePanel();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <header
      className="topbar-shell fixed top-0 left-0 lg:left-[64px] right-0 z-30 h-14 flex items-center px-4 lg:px-8 gap-4
        glass-effect border-b border-border-default
        dark:bg-dm-sidebar/95 dark:backdrop-blur-sm dark:border-dm-border
        transition-colors duration-300"
      style={{ boxShadow: "0 1px 8px rgba(22, 163, 74, 0.04)" }}
    >
      {/* Title block */}
      <div className="flex-shrink-0 min-w-0">
        <h1 className="font-bold text-base tracking-tight leading-tight text-on-surface dark:text-dm-text-primary truncate transition-colors duration-300">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] font-medium text-text-muted dark:text-dm-text-secondary mt-0.5 truncate hidden sm:block transition-colors duration-300">{subtitle}</p>
        )}
      </div>

      {/* Spacer + page-specific children */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        {children}
      </div>

      {/* Dark mode toggle */}
      <DarkModeToggle />

      {/* User avatar — opens profile panel */}
      <button
        id="topbar-avatar-btn"
        onClick={toggle}
        aria-label="Open profile panel"
        className="profile-avatar-trigger w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm signature-gradient flex-shrink-0 ring-2 ring-primary/10 hover:ring-primary/40 dark:ring-primary/40 hover:scale-105 active:scale-95 transition-all duration-150"
      >
        {photoURL ? (
          <img src={photoURL} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          userName.charAt(0).toUpperCase()
        )}
      </button>
    </header>
  );
}
