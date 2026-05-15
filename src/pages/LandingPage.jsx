import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.title = "StudySync | Cultivating Focus";
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("ss-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ss-theme", "light");
    }
  };

  return (
    <div className="ss-page min-h-screen">
      {/* ── TopNavBar ── */}
      <header className="ss-nav fixed top-0 w-full z-50 backdrop-blur-xl shadow-sm">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
          <div className="text-2xl font-bold tracking-tight ss-nav-logo">
            StudySync
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link className="ss-nav-link font-medium" to="/dashboard">Dashboard</Link>
            <a className="ss-nav-link font-medium" href="#features">Resources</a>
            <a className="ss-nav-link font-medium" href="#features">Library</a>
            <a className="ss-nav-link font-medium" href="#features">Groups</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle — between Groups and Login */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="ss-nav-link px-4 py-2 rounded-lg font-semibold transition-all active:scale-95"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="ss-btn-primary px-6 py-2.5 rounded-xl font-semibold shadow-md active:scale-95 transition-all"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* ── Hero Section ── */}
        <section className="ss-page relative overflow-hidden min-h-[921px] flex items-center">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-20">

            {/* Left column */}
            <div className="lg:col-span-6 z-10 animate-fade-in">
              {/* Badge pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full ss-badge font-bold text-[0.7rem] uppercase tracking-[0.1em] mb-6">
                <span className="material-symbols-outlined text-[1rem]">auto_awesome</span>
                <span>Your Academic Sanctuary</span>
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold ss-text-primary leading-[1.05] tracking-tight mb-8">
                StudySync
              </h1>
              <p className="text-xl md:text-2xl ss-text-secondary leading-relaxed max-w-xl mb-12">
                Organize your academic life 📚 with a sanctuary designed for deep focus and effortless productivity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="ss-btn-primary px-8 py-4 rounded-xl text-lg font-bold shadow-[0_20px_40px_rgba(0,108,73,0.15)] active:scale-95 transition-all hover:shadow-[0_24px_48px_rgba(0,108,73,0.25)]"
                >
                  Start Growing Now
                </button>
                <button className="ss-btn-outline px-8 py-4 rounded-xl text-lg font-bold active:scale-95 transition-all">
                  Watch the Tour
                </button>
              </div>

              {/* Avatar row */}
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img
                    className="w-10 h-10 rounded-full border-2 object-cover"
                    style={{ borderColor: "var(--page-bg)" }}
                    alt="Student smiling in a library"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCitg2E-6PGFqI24IK42pB0t4DzsBL3tSxuF9RmdmNXfEHSSixGqqKQA71EtcSQZbIQCedqJamOcyBV7ZeEhdzeYjvPguu07zZy-0k2m6X37SBTXE_HVqAJqfUV1wPvd_xNDc6MfTfTcPmDuVqPsmNmHKo4OXA6tlLp8yRuHxShxRfDy32aTnhS7gSbQfgyL_iaGNS2bouB-PIuju38kAjpqMiea9ngDtArMrCiPPYNaZzNS1xoFLFd008nE-ysGtJU8fNdDz7KxBo"
                  />
                  <img
                    className="w-10 h-10 rounded-full border-2 object-cover"
                    style={{ borderColor: "var(--page-bg)" }}
                    alt="Young man thinking"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_AJWb_GOTIPidUUryUzvicGTpf0LZvpngsMrLEyRZTcVZhBiFYWO-DTM9E8gUGDiFqcVeeiA6AuS8plQvbAxa3oVTpOC6Yeddc5_1zcUfUd32fdyFC37ZYkk9Cx01eDBTvn_cwEa3BiyW36NhjzjkYgqztFqhlS5dV5f34pBRLW2KlcEkwg_-6DGy7tY2EnnHNCl8TnZGyGZdagU4ZHHHTcFS6RqwtCwcFjoVvX33iXD-t9EXgWODroFuiirfUjU2fapKyim4NXE"
                  />
                  <img
                    className="w-10 h-10 rounded-full border-2 object-cover"
                    style={{ borderColor: "var(--page-bg)" }}
                    alt="Woman with glasses looking focused"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmnHdFI594jTnsIJS3GXdJwZ6Zs5RJhvcZLRROwouBg6YlIDIxJ46VS5xnHjKY_ivVwNLVM7_49drj6kp6jT4udiz_fiV_aXGydifleGbxwTiVs00taxtokPcJLAtoyzd8ojxe5UHByGZ22YFwqg62Lks_P-3r1pyG4UikamKv4srRFGWFJJjl7opLxpkMsrraaDZvJGMgoCniPlzkHQZ4syP3WJWXs3ZaQ9IAO8Lh7jFt7dYjD7bcBIppPYYK3lNwNxrA_mv_w88"
                  />
                </div>
                <p className="text-sm ss-text-secondary font-medium">
                  Join <span className="ss-text-accent font-bold">12,000+</span> focused students
                </p>
              </div>
            </div>

            {/* Right column – hero image */}
            <div className="lg:col-span-6 relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[100px] opacity-20" style={{ background: "var(--accent)" }} />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-[100px] opacity-10" style={{ background: "var(--card-bg-tinted)" }} />

              {/* Desk illustration container */}
              <div className="ss-card relative p-4 rounded-[2rem] shadow-[0_40px_80px_rgba(19,30,25,0.08)] transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img
                  className="rounded-[1.5rem] w-full h-[600px] object-cover"
                  alt="Modern minimalist home office with natural light, lush green plants, open laptop, and organized study materials"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF7Gr2eEooXesRMNAWwXRVxBiWU3EZKkJWj6yCu3GrbZoGhQHJRCpY-DVOWtzdBbNfxkjVjlk7MKcLPbWfkoXvFOd202PPGGW-1irNYWpmcMLMEbj1d0EbbhuUcNcQgFjQrh5PGuFIPLrhHCZijd-q4RwgmU4uXHSVUAjWFTnyMPeK5PbjqkbChRp2Ez5PLh778RyyGAnzm2Cuosh8wo93OVwvQ9tLx_eyc_rHOM9I_NMu9sa5g7kr1ZMwqg-aCVuxUCaaRTGao68"
                />

                {/* Focus Mode floating overlay card */}
                <div className="ss-focus-card absolute -bottom-6 -left-6 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-[240px] animate-float border"
                  style={{ borderColor: "var(--divider)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="material-symbols-outlined ss-icon-accent"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      eco
                    </span>
                    <span className="font-bold ss-text-primary">Focus Mode</span>
                  </div>
                  <div className="w-full ss-progress-track rounded-full h-1.5 mb-2">
                    <div className="ss-progress-fill h-1.5 rounded-full w-[85%]" />
                  </div>
                  <p className="text-xs ss-text-secondary">85% of daily target reached</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bento Grid Features ── */}
        <section id="features" className="ss-page py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
              <h2 className="text-4xl font-extrabold ss-text-primary mb-4 tracking-tight">
                Your digital forest for productivity
              </h2>
              <p className="text-lg ss-text-secondary">
                We've cultivated the tools you need to stay organized without the digital clutter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
              {/* Intelligent Library — large card */}
              <div className="md:col-span-2 ss-card p-10 rounded-[2rem] flex flex-col justify-between group overflow-hidden relative animate-slide-up">
                <div className="z-10">
                  <span className="material-symbols-outlined text-4xl ss-icon-accent mb-6 block">auto_stories</span>
                  <h3 className="text-3xl font-bold ss-text-primary mb-4">Intelligent Library</h3>
                  <p className="ss-text-secondary max-w-md text-lg leading-relaxed">
                    Automatically categorize your research papers, notes, and resources with our AI-driven tagging system.
                  </p>
                </div>
                <div className="mt-12 flex gap-4 overflow-hidden -mb-4">
                  <div className="ss-placeholder px-6 py-4 rounded-t-xl w-48 shadow-sm">
                    <div className="w-full h-2 rounded-full mb-3" style={{ background: "var(--accent)", opacity: 0.2 }} />
                    <div className="w-2/3 h-2 rounded-full" style={{ background: "var(--accent)", opacity: 0.1 }} />
                  </div>
                  <div className="ss-card-tinted px-6 py-4 rounded-t-xl w-48">
                    <div className="w-full h-2 rounded-full mb-3" style={{ background: "var(--accent)", opacity: 0.2 }} />
                    <div className="w-1/2 h-2 rounded-full" style={{ background: "var(--accent)", opacity: 0.1 }} />
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ss-text-primary">
                  <span className="material-symbols-outlined text-[12rem]">library_books</span>
                </div>
              </div>

              {/* Study Groups — solid accent card */}
              <div className="ss-card-accent-bg p-10 rounded-[2rem] flex flex-col justify-center animate-slide-up">
                <span className="material-symbols-outlined text-4xl mb-6 ss-text-on-accent">group</span>
                <h3 className="text-2xl font-bold mb-3 ss-text-on-accent">Study Groups</h3>
                <p className="text-lg leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Connect with peers in focused study rooms designed for collaborative deep work.
                </p>
              </div>

              {/* Seamless Sync — tinted card */}
              <div className="ss-card-tinted p-10 rounded-[2rem] flex flex-col justify-center animate-slide-up">
                <span className="material-symbols-outlined text-4xl ss-icon-accent mb-6 block">calendar_month</span>
                <h3 className="text-2xl font-bold ss-text-primary mb-3">Seamless Sync</h3>
                <p className="ss-text-secondary text-lg leading-snug">
                  Sync your academic calendar with your personal schedule for perfect balance.
                </p>
              </div>

              {/* Privacy First — large card */}
              <div className="md:col-span-2 ss-card p-10 rounded-[2rem] flex items-center gap-10 animate-slide-up">
                <div className="flex-1">
                  <span className="material-symbols-outlined text-4xl mb-6 block" style={{ color: "#e05c5c" }}>lock</span>
                  <h3 className="text-2xl font-bold ss-text-primary mb-3">Privacy First</h3>
                  <p className="ss-text-secondary text-lg">
                    Your data is yours. We encrypt your notes and library with military-grade protection.
                  </p>
                </div>
                <div className="hidden sm:block w-1/3 ss-card-tinted p-6 rounded-2xl">
                  <div className="space-y-3">
                    <div className="h-1.5 w-full rounded-full ss-placeholder" />
                    <div className="h-1.5 w-3/4 rounded-full ss-placeholder opacity-75" />
                    <div className="h-1.5 w-1/2 rounded-full ss-placeholder opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Academic Integrity Banner ── */}
        <section className="ss-page-alt py-20 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full ss-badge font-bold text-xs mb-8">
              CULTIVATING INTEGRITY
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold ss-text-primary mb-8 tracking-tight leading-tight">
              Tools built for students,<br />
              approved by institutions.
            </h2>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale contrast-125">
              <div className="ss-text-primary font-black text-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>OXFORD</div>
              <div className="ss-text-primary font-black text-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HARVARD</div>
              <div className="ss-text-primary font-black text-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>STANFORD</div>
              <div className="ss-text-primary font-black text-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MIT</div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="ss-footer w-full py-12 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-lg font-semibold ss-nav-logo">StudySync</div>
            <p className="ss-nav-link text-sm text-center md:text-left max-w-xs" style={{ opacity: 0.6 }}>
              © 2024 StudySync. Cultivating focus in the digital forest.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Academic Integrity", "Contact Us"].map((item) => (
              <a
                key={item}
                className="ss-nav-link text-sm tracking-wide transition-colors"
                style={{ opacity: 0.6 }}
                href="#"
                onMouseEnter={(e) => (e.target.style.opacity = 1)}
                onMouseLeave={(e) => (e.target.style.opacity = 0.6)}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <span className="material-symbols-outlined text-lg ss-nav-link">share</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <span className="material-symbols-outlined text-lg ss-nav-link">language</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
