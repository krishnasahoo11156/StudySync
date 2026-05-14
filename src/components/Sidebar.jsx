import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProfilePanel } from "../contexts/ProfilePanelContext";

/* ── Navigation items ── */
const NAV = [
  { to: "/dashboard",  icon: "dashboard",    label: "Sanctuary" },
  { to: "/calendar",   icon: "calendar_month", label: "Calendar" },
  { to: "/library",    icon: "folder_open",  label: "Library" },
  { to: "/focus",      icon: "self_improvement", label: "Flow" },
  { to: "/analytics",  icon: "insights",     label: "Insights" },
];

export default function Sidebar() {
  const { user, logout, photoURL } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggle: togglePanel } = useProfilePanel();
  const [expanded, setExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  /* ── Handle sign-out ── */
  const handleLogout = async () => {
    try { await logout(); navigate("/"); }
    catch (err) { console.error("Logout error:", err); }
  };

  /* Close sidebar on route change (mobile) */
  useEffect(() => { setExpanded(false); }, [location.pathname]);

  /* Keyboard shortcut: Ctrl+B to toggle */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setExpanded(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isFocusMode = location.pathname === "/focus";

  return (
    <>
      {/* ── Mobile overlay ── */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar-shell fixed top-0 left-0 h-full z-50 flex flex-col
          bg-white/95 dark:bg-dm-sidebar glass-nav border-r border-border-default dark:border-dm-border
          transition-all duration-300 ease-smooth
          ${expanded ? "w-[220px]" : "w-[64px]"}
          ${isFocusMode ? "lg:translate-x-0" : ""}
          -translate-x-full lg:translate-x-0`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => { setExpanded(false); setHoveredIdx(-1); }}
      >
        {/* ── Brand ── */}
        <div className={`flex items-center h-16 px-4 border-b border-border-default dark:border-dm-border ${expanded ? "gap-3" : "justify-center"}`}>
          <div className="w-8 h-8 rounded-lg signature-gradient flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
            <span className="text-sm font-bold text-on-surface dark:text-dm-text-primary whitespace-nowrap tracking-tight transition-colors duration-300">StudySync</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1" role="navigation" aria-label="Main navigation">
          {NAV.map((item, idx) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={`nav-${item.label.toLowerCase()}`}
                className={`group relative flex items-center rounded-xl transition-all duration-200
                  ${expanded ? "px-3 py-2.5 gap-3" : "justify-center py-2.5"}
                  ${isActive
                    ? "text-primary bg-primary/[0.08] dark:bg-dm-primary-bg dark:text-dm-text-green"
                    : "text-text-muted dark:text-dm-text-secondary hover:text-on-surface dark:hover:text-dm-text-primary hover:bg-surface-container-high/60 dark:hover:bg-dm-surface-hover"
                  }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(-1)}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary transition-all duration-200" />
                )}

                <span
                  className={`material-symbols-outlined text-[20px] transition-all duration-200 flex-shrink-0
                    ${isActive
                      ? "text-primary dark:text-dm-text-green"
                      : "text-text-muted dark:text-dm-text-secondary group-hover:text-on-surface dark:group-hover:text-dm-text-primary"
                    }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                >
                  {item.icon}
                </span>

                {/* Label */}
                <span className={`text-[13px] font-semibold whitespace-nowrap overflow-hidden transition-all duration-300
                  ${expanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
                  {item.label}
                </span>

                {/* Tooltip (collapsed state) */}
                {!expanded && hoveredIdx === idx && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-on-surface dark:bg-dm-surface-elevated text-white dark:text-dm-text-primary text-xs font-semibold rounded-lg whitespace-nowrap z-50 shadow-lg animate-scale-in pointer-events-none">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-on-surface dark:border-r-dm-surface-elevated" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Bottom section ── */}
        <div className={`px-2 pb-4 border-t border-border-default dark:border-dm-border pt-3 flex flex-col gap-1`}>
          {/* User avatar — opens profile panel */}
          <button
            id="sidebar-avatar-btn"
            onClick={togglePanel}
            aria-label="Open profile panel"
            className={`group flex items-center rounded-xl px-2 py-2 hover:bg-surface-container-high/60 dark:hover:bg-dm-surface-hover transition-all duration-150 ${
              expanded ? "gap-3" : "justify-center"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-150">
              {photoURL ? (
                <img src={photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-primary text-xs font-bold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "S"}
                </span>
              )}
            </div>
            <div className={`overflow-hidden transition-all duration-300 min-w-0 ${expanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
              <p className="text-xs font-semibold text-on-surface dark:text-dm-text-primary truncate leading-tight transition-colors duration-300">
                {user?.displayName || "Student"}
              </p>
              <p className="text-[10px] text-text-muted dark:text-dm-text-secondary truncate leading-tight transition-colors duration-300">
                {user?.email || ""}
              </p>
            </div>
          </button>

          {/* Sign out */}
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            className={`group flex items-center rounded-xl text-text-muted dark:text-dm-text-secondary hover:text-error-dark dark:hover:text-dm-error hover:bg-error-container/40 dark:hover:bg-dm-error-bg transition-all duration-200
              ${expanded ? "px-3 py-2.5 gap-3" : "justify-center py-2.5"}`}
          >
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
            <span className={`text-[13px] font-semibold whitespace-nowrap overflow-hidden transition-all duration-300
              ${expanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile hamburger ── */}
      <button
        id="mobile-menu-toggle"
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-white/90 dark:bg-dm-surface glass-nav border border-border-default dark:border-dm-border flex items-center justify-center shadow-raised"
        onClick={() => setExpanded(v => !v)}
        aria-label="Toggle navigation"
      >
        <span className="material-symbols-outlined text-on-surface dark:text-dm-text-primary text-xl">
          {expanded ? "close" : "menu"}
        </span>
      </button>
    </>
  );
}
