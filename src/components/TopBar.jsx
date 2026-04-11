import { useAuth } from "../contexts/AuthContext";

/* ═══════════════════════════════════════════
   TOP BAR — unified, used by every page
   Props:
     title       - page title string
     subtitle    - optional subtitle string
     onMenuClick - hamburger click handler (mobile)
     children    - slot for page-specific controls
                   (search bar, filter tabs, export buttons, etc.)
═══════════════════════════════════════════ */
export default function TopBar({ title, subtitle, onMenuClick, children }) {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 z-30 h-20 bg-emerald-50/80 backdrop-blur-xl flex items-center px-5 lg:px-10 gap-4 border-b border-emerald-100/50">
      {/* Hamburger (mobile) */}
      <button
        className="lg:hidden text-emerald-700 hover:bg-emerald-100 p-2 rounded-xl transition-colors"
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Title block */}
      <div className="flex-shrink-0">
        <h1 className="text-emerald-900 font-extrabold text-xl tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-emerald-600/70 text-xs font-medium mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Spacer before page-specific children */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {children}
      </div>

      {/* Right-side icons (always present) */}
      <button className="p-2 text-emerald-700/60 hover:bg-emerald-100 rounded-full transition-colors">
        <span className="material-symbols-outlined">notifications</span>
      </button>

      {/* User avatar */}
      <div className="w-9 h-9 rounded-full signature-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">
        {userName.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}
