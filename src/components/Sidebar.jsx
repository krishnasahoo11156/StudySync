import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ═══════════════════════════════════════════
   NAVIGATION ITEMS — single source of truth
═══════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: "sanctuary", icon: "home",          label: "Sanctuary", path: "/dashboard" },
  { id: "library",   icon: "menu_book",     label: "Library",   path: "/library"   },
  { id: "focus",     icon: "timer",         label: "Focus",     path: "/focus"     },
  { id: "analytics", icon: "bar_chart",     label: "Analytics", path: "/analytics" },
  { id: "calendar",  icon: "calendar_month",label: "Calendar",  path: "/calendar"  },
];

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
          fixed left-0 top-0 h-screen w-72
          flex flex-col z-40
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAF9 100%)",
          borderRight: "1px solid #E4EDEA",
          boxShadow: "4px 0 24px rgba(22, 163, 74, 0.06)",
        }}
      >
        {/* ── Top accent stripe ── */}
        <div className="h-1 w-full signature-gradient" />

        <div className="flex flex-col flex-1 p-6 gap-4 overflow-y-auto">

          {/* ── Logo ── */}
          <div className="mb-2 px-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl signature-gradient flex items-center justify-center shadow-btn">
                <span className="material-symbols-outlined text-white text-xl">school</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-[#1A2621] leading-none tracking-tight">StudySync</span>
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#8FA99F]">Deep Focus</p>
              </div>
            </div>
            <button
              className="lg:hidden text-[#3D524A] hover:bg-[#F1F5F4] p-1.5 rounded-xl transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* ── User Card ── */}
          <div className="mb-2 rounded-2xl p-4" style={{ background: "#F5F1E8", border: "1px solid #D6C7AE" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #15803D, #16A34A)" }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-[#1A2621] font-bold text-sm leading-tight">{greeting},</h3>
                <p className="text-[#3D524A] text-xs font-semibold truncate max-w-[140px]">{userName}</p>
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
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl w-full text-left
                    transition-all duration-200 group
                    ${isActive
                      ? "text-white shadow-btn"
                      : "text-[#3D524A] hover:bg-[#F1F5F4] hover:text-[#1A2621]"
                    }
                  `}
                  style={isActive ? {
                    background: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
                  } : {}}
                >
                  <span
                    className="material-symbols-outlined text-xl transition-transform duration-200 group-hover:scale-110"
                    style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 500" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className="font-semibold tracking-wide text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </button>
              );
            })}

            {/* Spacer */}
            <div className="flex-1" />

            {/* ── CTA — Start Focus Session ── */}
            <button
              onClick={() => { navigate("/focus"); setSidebarOpen(false); }}
              className="mx-0 my-2 py-3.5 px-4 rounded-2xl text-white font-bold text-sm
                hover:opacity-90 active:scale-[0.97] transition-all
                flex items-center justify-center gap-2 signature-gradient shadow-btn"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              Start Focus Session
            </button>

            {/* ── Bottom Links ── */}
            <div className="space-y-0.5 pt-1 border-t border-[#E4EDEA]">
              <button className="flex items-center gap-3.5 px-4 py-2.5 text-[#8FA99F] hover:bg-[#F1F5F4] hover:text-[#3D524A] transition-all rounded-xl w-full text-left">
                <span className="material-symbols-outlined text-xl">help_outline</span>
                <span className="font-semibold tracking-wide text-sm">Help</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3.5 px-4 py-2.5 text-[#8FA99F] hover:bg-[#FEE2E2] hover:text-[#EF4444] transition-all rounded-xl w-full text-left"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                <span className="font-semibold tracking-wide text-sm">Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
