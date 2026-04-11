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
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main area */}
      <main className="lg:ml-72 min-h-screen relative">
        {/* Top Bar */}
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        >
          {topBarChildren}
        </TopBar>

        {/* Page content (below fixed top bar) */}
        <div className="pt-24 px-5 lg:px-10 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
