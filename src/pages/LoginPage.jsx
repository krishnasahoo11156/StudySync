import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.title = "StudySync - Login";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      const code = err.code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-page min-h-screen flex flex-col overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="ss-nav fixed top-0 w-full z-50 backdrop-blur-xl shadow-sm">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
          <Link to="/" className="text-2xl font-bold tracking-tighter ss-nav-logo">
            StudySync
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link className="ss-nav-link font-medium" to="/">Solutions</Link>
            <Link className="ss-nav-link font-medium" to="/">Resources</Link>
            <Link className="ss-nav-link-active font-semibold" to="/login" style={{ color: "var(--nav-text-active)" }}>
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="ss-btn-primary px-6 py-2.5 rounded-xl font-medium transition-all hover:opacity-90 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6 relative">
        {/* Background decorative blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-[100px] pointer-events-none"
          style={{ background: "var(--accent)", opacity: 0.05 }} />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "var(--card-bg-tinted)", opacity: 0.3 }} />

        <section className="w-full max-w-[1100px] grid md:grid-cols-12 items-center gap-12 z-10">
          {/* Left branding (desktop) */}
          <div className="hidden md:flex md:col-span-5 flex-col gap-6 pr-8 animate-fade-in">
            <h1 className="text-[3.5rem] font-extrabold leading-[1.1] tracking-[-0.03em] ss-text-primary">
              Your focus <br />
              <span className="ss-text-accent">evolved.</span>
            </h1>
            <p className="text-[1.125rem] ss-text-secondary leading-relaxed max-w-sm">
              Re-enter your sanctuary of study. Where calm meets peak productivity.
            </p>
            <div className="mt-8">
              <img
                alt="Calm workspace with plant"
                className="w-full h-64 object-cover rounded-[2rem] grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIt9gywUXpuYbTl4uuoEPCa1lIjYIhuT1Bk1pozGz9llUzsc_iv4ochkPkfjvTtyyj1xYRqq6ZHdaaKk2Fo8e2x73jq4UA27J-apAWNtRJjJXWiDlEReOd0DhB31KZ4iJfiyKeRoYc-AMkSPKFXQo7aFgbWyOxXXa9UABMjI9yzj6y79rvYjHlfN6W0Pw7YJQAk1bhgfeqc3EQ0cc3ogdCLc8d2RDTXZcDKTfAWKjgFPwm6dVuYJNvAdnbyGNPxxiU6BP4rs2pWIw"
              />
            </div>
          </div>

          {/* Login Card */}
          <div className="md:col-span-7 flex justify-center animate-slide-up">
            <div
              className="ss-auth-card ambient-shadow p-10 md:p-16 w-full max-w-[540px]"
              style={{ borderRadius: "2.5rem" }}
            >
              <div className="mb-12">
                <span className="ss-text-accent font-bold tracking-tighter text-2xl">StudySync</span>
                <h2 className="text-[2.75rem] font-bold tracking-[-0.02em] leading-tight mt-4 ss-text-primary">
                  Log in to your account
                </h2>
                <p className="ss-text-secondary mt-2 opacity-70">
                  Welcome back to your verdant sanctuary.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl text-sm font-medium animate-scale-in"
                  style={{ background: "#fde8e8", color: "#991b1b" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[0.75rem] font-bold uppercase tracking-[0.05em] ss-text-secondary block ml-1">
                    Email Address
                  </label>
                  <input
                    className="ss-input w-full rounded-xl py-4 px-6"
                    placeholder="alex@university.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[0.75rem] font-bold uppercase tracking-[0.05em] ss-text-secondary block ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="ss-input w-full rounded-xl py-4 px-6 pr-14"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 ss-text-secondary hover:ss-text-accent transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        className="peer appearance-none w-5 h-5 rounded-md checked:bg-green-600 transition-all cursor-pointer"
                        style={{ background: "var(--card-bg-tinted)", border: "1px solid var(--input-border)" }}
                        type="checkbox"
                      />
                      <span className="material-symbols-outlined absolute text-[14px] text-white opacity-0 peer-checked:opacity-100 left-1/2 -translate-x-1/2 pointer-events-none">
                        check
                      </span>
                    </div>
                    <span className="ss-text-secondary">Remember me</span>
                  </label>
                  <a className="ss-text-accent font-semibold hover:opacity-70 transition-opacity" href="#">
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    className="ss-btn-primary text-[1.125rem] font-bold py-4 px-12 rounded-xl ambient-shadow hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                        Logging in...
                      </span>
                    ) : (
                      "Login"
                    )}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="ss-divider my-8" />

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="ss-text-secondary">Don't have an account?</span>
                <Link className="ss-text-accent font-bold hover:underline underline-offset-4" to="/signup">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Glass Hint */}
        <aside className="fixed bottom-12 right-12 hidden lg:flex items-center gap-4 p-4 pr-8 rounded-full shadow-card z-20 transition-all hover:translate-y-[-4px]"
          style={{ background: "var(--card-bg)", border: "1px solid var(--divider)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center ss-text-accent"
            style={{ background: "var(--card-bg-tinted)" }}>
            <span className="material-symbols-outlined text-[20px]">info</span>
          </div>
          <p className="text-[0.875rem] font-medium ss-text-primary">
            Enter your school email to get started
          </p>
        </aside>
      </main>

      {/* Footer */}
      <footer className="w-full pb-8 flex flex-col items-center gap-4 text-[10px] uppercase tracking-widest ss-text-secondary">
        <div className="flex gap-6">
          {["Privacy", "Terms", "Support"].map((item) => (
            <a key={item} className="ss-text-secondary hover:ss-text-primary transition-all opacity-80 hover:opacity-100" href="#">
              {item}
            </a>
          ))}
        </div>
        <p>© 2024 StudySync Sanctuary. Breathe deep, study well.</p>
      </footer>
    </div>
  );
}
