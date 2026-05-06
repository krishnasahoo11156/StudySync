import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ProfilePanel from "./ProfilePanel";
import { ProfilePanelProvider } from "../contexts/ProfilePanelContext";

/* ═══════════════════════════════════════════
   PAGE SHELL — layout wrapper for every page
   64px sidebar + 56px topbar + content area
═══════════════════════════════════════════ */
export default function PageShell({ activePage, title, subtitle, topBarChildren, children }) {
  return (
    <ProfilePanelProvider>
      <div className="min-h-screen bg-surface text-on-surface">
        <Sidebar activePage={activePage} />
        <main className="lg:ml-[64px] min-h-screen relative">
          <TopBar title={title} subtitle={subtitle}>
            {topBarChildren}
          </TopBar>
          <div className="content-shell pt-[72px] px-4 lg:px-8 pb-12">
            {children}
          </div>
        </main>
        {/* Profile panel rendered outside main flow — fixed/absolute positioned */}
        <ProfilePanel />
      </div>
    </ProfilePanelProvider>
  );
}
