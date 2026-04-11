import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "StudySync | Cultivating Focus";
  }, []);

  return (
    <div className="bg-background text-on-surface selection:bg-secondary-container selection:text-on-secondary-container min-h-screen">
      {/* ── TopNavBar ── */}
      <header className="fixed top-0 w-full z-50 bg-emerald-50/70 dark:bg-emerald-950/70 backdrop-blur-xl shadow-sm dark:shadow-none">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
          <div className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-100 font-headline">
            StudySync
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link
              className="text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors font-body"
              to="/dashboard"
            >
              Dashboard
            </Link>
            <a
              className="text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors font-body"
              href="#features"
            >
              Resources
            </a>
            <a
              className="text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors font-body"
              href="#features"
            >
              Library
            </a>
            <a
              className="text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors font-body"
              href="#features"
            >
              Groups
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2.5 rounded-xl font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-800/50 transition-all active:scale-95 duration-200"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-700 dark:bg-emerald-600 text-white signature-gradient shadow-md active:scale-95 duration-200 transition-all"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden min-h-[921px] flex items-center">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-20">
            <div className="lg:col-span-6 z-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label text-[0.7rem] uppercase tracking-[0.1em] mb-6">
                <span className="material-symbols-outlined text-[1rem]">auto_awesome</span>
                <span>Your Academic Sanctuary</span>
              </div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-on-surface leading-[1.05] tracking-tight mb-8">
                StudySync
              </h1>
              <p className="text-xl md:text-2xl text-on-surface-variant font-body leading-relaxed max-w-xl mb-12">
                Organize your academic life 📚 with a sanctuary designed for deep focus and effortless
                productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="px-8 py-4 rounded-xl text-lg font-bold text-on-primary signature-gradient shadow-[0_20px_40px_rgba(0,108,73,0.15)] active:scale-95 transition-all hover:shadow-[0_24px_48px_rgba(0,108,73,0.25)]"
                >
                  Start Growing Now
                </button>
                <button className="px-8 py-4 rounded-xl text-lg font-bold text-primary bg-surface-container-highest hover:bg-surface-container-high transition-all active:scale-95">
                  Watch the Tour
                </button>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img
                    className="w-10 h-10 rounded-full border-2 border-background object-cover"
                    alt="Student smiling in a library"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCitg2E-6PGFqI24IK42pB0t4DzsBL3tSxuF9RmdmNXfEHSSixGqqKQA71EtcSQZbIQCedqJamOcyBV7ZeEhdzeYjvPguu07zZy-0k2m6X37SBTXE_HVqAJqfUV1wPvd_xNDc6MfTfTcPmDuVqPsmNmHKo4OXA6tlLp8yRuHxShxRfDy32aTnhS7gSbQfgyL_iaGNS2bouB-PIuju38kAjpqMiea9ngDtArMrCiPPYNaZzNS1xoFLFd008nE-ysGtJU8fNdDz7KxBo"
                  />
                  <img
                    className="w-10 h-10 rounded-full border-2 border-background object-cover"
                    alt="Young man thinking"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_AJWb_GOTIPidUUryUzvicGTpf0LZvpngsMrLEyRZTcVZhBiFYWO-DTM9E8gUGDiFqcVeeiA6AuS8plQvbAxa3oVTpOC6Yeddc5_1zcUfUd32fdyFC37ZYkk9Cx01eDBTvn_cwEa3BiyW36NhjzjkYgqztFqhlS5dV5f34pBRLW2KlcEkwg_-6DGy7tY2EnnHNCl8TnZGyGZdagU4ZHHHTcFS6RqwtCwcFjoVvX33iXD-t9EXgWODroFuiirfUjU2fapKyim4NXE"
                  />
                  <img
                    className="w-10 h-10 rounded-full border-2 border-background object-cover"
                    alt="Woman with glasses looking focused"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmnHdFI594jTnsIJS3GXdJwZ6Zs5RJhvcZLRROwouBg6YlIDIxJ46VS5xnHjKY_ivVwNLVM7_49drj6kp6jT4udiz_fiV_aXGydifleGbxwTiVs00taxtokPcJLAtoyzd8ojxe5UHByGZ22YFwqg62Lks_P-3r1pyG4UikamKv4srRFGWFJJjl7opLxpkMsrraaDZvJGMgoCniPlzkHQZ4syP3WJWXs3ZaQ9IAO8Lh7jFt7dYjD7bcBIppPYYK3lNwNxrA_mv_w88"
                  />
                </div>
                <p className="text-sm text-on-surface-variant font-medium">
                  Join <span className="text-primary font-bold">12,000+</span> focused students
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px]" />
              <div className="relative bg-surface-container-lowest p-4 rounded-[2rem] shadow-[0_40px_80px_rgba(19,30,25,0.08)] transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img
                  className="rounded-[1.5rem] w-full h-[600px] object-cover"
                  alt="Modern minimalist home office with natural light, lush green plants, open laptop, and organized study materials"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF7Gr2eEooXesRMNAWwXRVxBiWU3EZKkJWj6yCu3GrbZoGhQHJRCpY-DVOWtzdBbNfxkjVjlk7MKcLPbWfkoXvFOd202PPGGW-1irNYWpmcMLMEbj1d0EbbhuUcNcQgFjQrh5PGuFIPLrhHCZijd-q4RwgmU4uXHSVUAjWFTnyMPeK5PbjqkbChRp2Ez5PLh778RyyGAnzm2Cuosh8wo93OVwvQ9tLx_eyc_rHOM9I_NMu9sa5g7kr1ZMwqg-aCVuxUCaaRTGao68"
                />
                <div className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-[240px] animate-float">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      eco
                    </span>
                    <span className="font-bold text-on-surface">Focus Mode</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 mb-2">
                    <div className="bg-primary h-1.5 rounded-full w-[85%]" />
                  </div>
                  <p className="text-xs text-on-surface-variant">85% of daily target reached</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bento Grid Features ── */}
        <section id="features" className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
              <h2 className="text-4xl font-extrabold text-on-surface mb-4 tracking-tight">
                Your digital forest for productivity
              </h2>
              <p className="text-lg text-on-surface-variant">
                We've cultivated the tools you need to stay organized without the digital clutter.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
              {/* Large Feature */}
              <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-[2rem] flex flex-col justify-between group overflow-hidden relative animate-slide-up">
                <div className="z-10">
                  <span className="material-symbols-outlined text-4xl text-primary mb-6">auto_stories</span>
                  <h3 className="text-3xl font-bold text-on-surface mb-4">Intelligent Library</h3>
                  <p className="text-on-surface-variant max-w-md text-lg leading-relaxed">
                    Automatically categorize your research papers, notes, and resources with our AI-driven
                    tagging system.
                  </p>
                </div>
                <div className="mt-12 flex gap-4 overflow-hidden -mb-4">
                  <div className="bg-surface-container-low px-6 py-4 rounded-t-xl w-48 shadow-sm">
                    <div className="w-full h-2 bg-primary/20 rounded-full mb-3" />
                    <div className="w-2/3 h-2 bg-primary/10 rounded-full" />
                  </div>
                  <div className="bg-surface-container-high px-6 py-4 rounded-t-xl w-48">
                    <div className="w-full h-2 bg-primary/20 rounded-full mb-3" />
                    <div className="w-1/2 h-2 bg-primary/10 rounded-full" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-[12rem]">library_books</span>
                </div>
              </div>
              {/* Small Feature 1 */}
              <div className="bg-primary p-10 rounded-[2rem] text-on-primary flex flex-col justify-center signature-gradient animate-slide-up">
                <span className="material-symbols-outlined text-4xl mb-6">group</span>
                <h3 className="text-2xl font-bold mb-3">Study Groups</h3>
                <p className="text-primary-fixed-dim/90 text-lg leading-snug">
                  Connect with peers in focused study rooms designed for collaborative deep work.
                </p>
              </div>
              {/* Small Feature 2 */}
              <div className="bg-surface-container-highest p-10 rounded-[2rem] flex flex-col justify-center animate-slide-up">
                <span className="material-symbols-outlined text-4xl text-secondary mb-6">calendar_month</span>
                <h3 className="text-2xl font-bold text-on-surface mb-3">Seamless Sync</h3>
                <p className="text-on-surface-variant text-lg leading-snug">
                  Sync your academic calendar with your personal schedule for perfect balance.
                </p>
              </div>
              {/* Large Feature 2 */}
              <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-[2rem] flex items-center gap-10 animate-slide-up">
                <div className="flex-1">
                  <span className="material-symbols-outlined text-4xl text-tertiary mb-6">lock</span>
                  <h3 className="text-2xl font-bold text-on-surface mb-3">Privacy First</h3>
                  <p className="text-on-surface-variant text-lg">
                    Your data is yours. We encrypt your notes and library with military-grade protection.
                  </p>
                </div>
                <div className="hidden sm:block w-1/3 bg-tertiary-container/10 p-6 rounded-2xl">
                  <div className="space-y-3">
                    <div className="h-1.5 w-full bg-tertiary-container/40 rounded-full" />
                    <div className="h-1.5 w-3/4 bg-tertiary-container/30 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-tertiary-container/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Academic Integrity Banner ── */}
        <section className="py-20 bg-background overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label text-xs mb-8">
              CULTIVATING INTEGRITY
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-8 tracking-tight leading-tight">
              Tools built for students,
              <br />
              approved by institutions.
            </h2>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale contrast-125">
              <div className="font-headline text-2xl font-black">OXFORD</div>
              <div className="font-headline text-2xl font-black">HARVARD</div>
              <div className="font-headline text-2xl font-black">STANFORD</div>
              <div className="font-headline text-2xl font-black">MIT</div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-emerald-900 dark:bg-black w-full py-12 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-lg font-semibold text-emerald-50 font-headline">StudySync</div>
            <p className="text-emerald-300/60 font-body text-sm text-center md:text-left max-w-xs">
              © 2024 StudySync. Cultivating focus in the digital forest.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a
              className="text-emerald-300/60 hover:text-emerald-100 transition-colors font-body text-sm tracking-wide"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-emerald-300/60 hover:text-emerald-100 transition-colors font-body text-sm tracking-wide"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="text-emerald-300/60 hover:text-emerald-100 transition-colors font-body text-sm tracking-wide"
              href="#"
            >
              Academic Integrity
            </a>
            <a
              className="text-emerald-300/60 hover:text-emerald-100 transition-colors font-body text-sm tracking-wide"
              href="#"
            >
              Contact Us
            </a>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-400 hover:text-emerald-100 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">share</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-400 hover:text-emerald-100 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">language</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
