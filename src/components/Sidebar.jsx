import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ═══════════════════════════════════════════
   NAVIGATION ITEMS — single source of truth
═══════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: "sanctuary", icon: "home",      label: "Sanctuary", path: "/dashboard" },
  { id: "library",   icon: "menu_book", label: "Library",   path: "/library"   },
  { id: "focus",     icon: "timer",     label: "Focus",     path: "/focus"     },
  { id: "analytics", icon: "bar_chart", label: "Analytics", path: "/analytics" },
  { id: "community", icon: "groups",    label: "Community", path: "#"          },
];

/* ═══════════════════════════════════════════
   SIDEBAR — unified, used by every page
   Props:
     activePage  - id of the currently active nav item
     sidebarOpen - boolean (mobile drawer state)
     setSidebarOpen - setter
═══════════════════════════════════════════ */
export default function Sidebar({ activePage, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen w-72 bg-emerald-50 rounded-r-3xl
          flex flex-col p-6 gap-4 z-40
          shadow-xl shadow-emerald-900/5
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ── Logo ── */}
        <div className="mb-2 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl signature-gradient flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-lg">school</span>
            </div>
            <div>
              <span className="text-lg font-extrabold text-emerald-900 leading-none tracking-tight">StudySync</span>
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-600/70">Deep Focus</p>
            </div>
          </div>
          <button className="lg:hidden text-emerald-700 hover:bg-emerald-100 p-1 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── User Avatar ── */}
        <div className="mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center text-on-primary text-lg font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-on-surface font-bold text-sm leading-tight">{greeting}, {userName}</h3>
              <p className="text-on-surface-variant text-xs opacity-70">Ready for a deep breath?</p>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = item.id === activePage;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path !== "#") {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }
                }}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl w-full text-left
                  transition-all duration-200
                  ${isActive
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/10"
                    : "text-emerald-700/70 hover:bg-emerald-100 hover:text-emerald-800"
                  }
                  ${item.path === "#" ? "opacity-60 cursor-default" : ""}
                `}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="font-semibold tracking-wide text-sm">{item.label}</span>
              </button>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── CTA Button ── */}
          <button
            onClick={() => { navigate("/focus"); setSidebarOpen(false); }}
            className="mx-1 my-2 py-3 px-4 rounded-xl signature-gradient text-white font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            Start Focus Session
          </button>

          {/* ── Bottom Links ── */}
          <button className="flex items-center gap-4 px-4 py-2.5 text-emerald-700/60 hover:bg-emerald-100 hover:text-emerald-700 transition-all rounded-xl w-full text-left">
            <span className="material-symbols-outlined text-xl">help_outline</span>
            <span className="font-semibold tracking-wide text-sm">Help</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-2.5 text-emerald-700/60 hover:bg-emerald-100 hover:text-emerald-700 transition-all rounded-xl w-full text-left"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-semibold tracking-wide text-sm">Sign Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
