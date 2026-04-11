import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/* ═══════════════════════════════════════════
   PAGE SHELL — layout wrapper for every page
   Composes Sidebar + TopBar + main content.

   Props:
     activePage     - which nav item to highlight
     title          - page title in the top bar
     subtitle       - optional subtitle in the top bar
     topBarChildren - JSX to render inside TopBar's children slot
     children       - the page content
═══════════════════════════════════════════ */
export default function PageShell({ activePage, title, subtitle, topBarChildren, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#F8FAF9", color: "#1A2621" }}>
      <Sidebar activePage={activePage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="lg:ml-72 min-h-screen relative">
        <TopBar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)}>
          {topBarChildren}
        </TopBar>
        <div className="pt-24 px-5 lg:px-10 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
