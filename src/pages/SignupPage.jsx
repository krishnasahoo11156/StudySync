import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import { sendWelcomeEmail } from "../services/emailService";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.title = "StudySync - Sign Up";
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Send welcome email — non-blocking
      sendWelcomeEmail({ firstName: name.split(" ")[0], email });
      navigate("/dashboard");
    } catch (err) {
      const code = err.code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
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
            <Link className="ss-nav-link font-medium" to="/login">Sign In</Link>
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
            <Link
              to="/login"
              className="ss-btn-outline px-5 py-2 rounded-xl font-medium transition-all text-sm"
            >
              Log in
            </Link>
          </div>
        </nav>
      </header>

      {/* Background decorative blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-0"
        style={{ background: "var(--accent)", opacity: 0.04 }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none z-0"
        style={{ background: "var(--card-bg-tinted)", opacity: 0.25 }} />

      <main className="relative z-10 flex-grow flex items-center justify-center px-6 pt-28 pb-12">
        <div className="w-full max-w-7xl flex flex-col items-center md:items-start">

          {/* Main Form Card */}
          <div className="relative z-10 w-full max-w-2xl ss-auth-card p-10 md:p-16 shadow-[0_20px_40px_rgba(19,30,25,0.06)] md:ml-[5%] md:mr-auto animate-slide-up"
            style={{ borderRadius: "2rem" }}>

            {/* Header */}
            <header className="mb-12">
              <h1 className="text-[2.75rem] font-bold tracking-tight ss-text-primary leading-tight mb-4">
                Join StudySync
              </h1>
              <p className="text-lg ss-text-secondary leading-relaxed max-w-md">
                Create an account to start organizing your academic life with intentional focus and clarity.
              </p>
            </header>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl text-sm font-medium animate-scale-in"
                style={{ background: "#fde8e8", color: "#991b1b" }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Full Name */}
              <div className="space-y-3">
                <label className="block text-[0.75rem] uppercase tracking-widest font-semibold ss-text-secondary px-1">
                  Full name
                </label>
                <input
                  className="ss-input w-full rounded-xl px-6 py-4"
                  placeholder="Enter your name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <label className="block text-[0.75rem] uppercase tracking-widest font-semibold ss-text-secondary px-1">
                  Email
                </label>
                <input
                  className="ss-input w-full rounded-xl px-6 py-4"
                  placeholder="student@university.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div className="space-y-3">
                  <label className="block text-[0.75rem] uppercase tracking-widest font-semibold ss-text-secondary px-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="ss-input w-full rounded-xl px-6 py-4 pr-14"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 ss-text-secondary transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <p className="text-[0.7rem] ss-text-secondary px-1 opacity-70">
                    Use 8+ characters with mixed types
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-3">
                  <label className="block text-[0.75rem] uppercase tracking-widest font-semibold ss-text-secondary px-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      className="ss-input w-full rounded-xl px-6 py-4 pr-14"
                      placeholder="••••••••"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 ss-text-secondary transition-colors"
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirm ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                <Link
                  className="ss-text-accent text-sm font-medium hover:underline underline-offset-4 order-2 md:order-1"
                  to="/login"
                >
                  Already have an account? <span className="underline">Log in</span>
                </Link>
                <button
                  className="ss-btn-primary w-full md:w-auto px-10 py-4 rounded-xl text-[0.75rem] uppercase tracking-widest font-bold shadow-lg active:scale-95 transition-transform order-1 md:order-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            {/* Disclaimer */}
            <footer className="mt-12 pt-8" style={{ borderTop: "1px solid var(--divider)" }}>
              <p className="text-[0.7rem] ss-text-secondary text-center leading-relaxed opacity-60">
                By signing up, you agree to StudySync's{" "}
                <a className="underline ss-text-accent hover:opacity-80" href="#">terms of service</a>{" "}and{" "}
                <a className="underline ss-text-accent hover:opacity-80" href="#">privacy policy</a>.
              </p>
            </footer>
          </div>

          {/* Overlapping Aesthetic Image */}
          <div className="hidden lg:block absolute top-[15%] right-[5%] w-64 h-64 rounded-3xl overflow-hidden shadow-2xl z-0 transform rotate-3">
            <img
              className="w-full h-full object-cover grayscale-[0.2] opacity-80"
              alt="Clean organized workspace with a succulent and student writing"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwMnoAN5ut0opNn_3ZVqT27bNV1hqhBSqj7ag_LAwQ6T_K0yb8j_CKYjc7tN7yz9p8BRww3NaI4Mx5dJLsnlmWT6cMvdSi_vR6pQRp2u6nied73Kcp-obTTeDPMJUSU3FAwB_OXASXZ02dwXGDs8JYzwvfA64RguFA88IpCGfgDrg3FFPIX5tPKzYhHR3E5f1zn591PneOhiJE8aGPeWZXpXYn7nHPqSPIKnBcsJf5mkrS-ZbTRsUMA06Tticniv481aHXcdN1czs"
            />
          </div>

          {/* Floating Privacy Card */}
          <div
            className="fixed bottom-12 right-12 max-w-[240px] p-6 rounded-2xl z-20 hidden md:block shadow-[0_20px_40px_rgba(19,30,25,0.06)]"
            style={{ background: "var(--card-bg)", border: "1px solid var(--divider)" }}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full ss-text-accent" style={{ background: "var(--card-bg-tinted)" }}>
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <p className="text-[0.75rem] leading-relaxed ss-text-primary font-medium">
                Your data is only used to help you stay on track. Privacy is our priority.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer watermark */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
        <span className="text-[0.75rem] uppercase tracking-[0.2em] font-bold ss-text-accent opacity-40">
          StudySync
        </span>
      </div>
    </div>
  );
}
