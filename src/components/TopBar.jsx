import { useAuth } from "../contexts/AuthContext";

/* ═══════════════════════════════════════════
   TOP BAR — unified, used by every page
═══════════════════════════════════════════ */
export default function TopBar({ title, subtitle, onMenuClick, children }) {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <header
      className="fixed top-0 left-0 lg:left-72 right-0 z-30 h-20 flex items-center px-5 lg:px-10 gap-4"
      style={{
        background: "rgba(248, 250, 249, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid #E4EDEA",
        boxShadow: "0 1px 12px rgba(22, 163, 74, 0.05)",
      }}
    >
      {/* Hamburger (mobile) */}
      <button
        className="lg:hidden p-2 rounded-xl transition-colors hover:bg-[#F1F5F4]"
        style={{ color: "#3D524A" }}
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Title block */}
      <div className="flex-shrink-0">
        <h1 className="font-extrabold text-xl tracking-tight leading-tight" style={{ color: "#1A2621" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs font-medium mt-0.5" style={{ color: "#8FA99F" }}>{subtitle}</p>
        )}
      </div>

      {/* Spacer + page-specific children */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {children}
      </div>

      {/* User avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-btn flex-shrink-0 signature-gradient"
      >
        {userName.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}
