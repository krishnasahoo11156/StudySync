import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";

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

  useEffect(() => {
    document.title = "StudySync - Sign Up";
  }, []);

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
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 md:p-12 overflow-x-hidden">
      {/* Background Decorative */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="relative w-full max-w-7xl flex flex-col items-center md:items-start">
        {/* Main Form Card */}
        <div className="relative z-10 w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] p-10 md:p-16 shadow-[0_20px_40px_rgba(19,30,25,0.06)] md:ml-[5%] md:mr-auto transition-all animate-slide-up">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-[2.75rem] font-bold tracking-tight text-on-surface leading-tight mb-4 font-headline">
              Join StudySync
            </h1>
            <p className="text-lg text-on-surface-variant font-body leading-relaxed max-w-md">
              Create an account to start organizing your academic life with intentional focus and clarity.
            </p>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium animate-scale-in">
              {error}
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name */}
            <div className="space-y-3">
              <label className="block text-[0.75rem] uppercase tracking-widest font-semibold text-on-surface-variant px-1 font-label">
                Full name
              </label>
              <input
                className="w-full bg-surface-container-highest border-0 rounded-xl px-6 py-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Enter your name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="block text-[0.75rem] uppercase tracking-widest font-semibold text-on-surface-variant px-1 font-label">
                Email
              </label>
              <input
                className="w-full bg-surface-container-highest border-0 rounded-xl px-6 py-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="student@university.edu"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[0.75rem] uppercase tracking-widest font-semibold text-on-surface-variant px-1 font-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-0 rounded-xl px-6 py-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <p className="text-[0.7rem] text-on-surface-variant/70 px-1 font-body">
                  Use 8+ characters with mixed types
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-[0.75rem] uppercase tracking-widest font-semibold text-on-surface-variant px-1 font-label">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-0 rounded-xl px-6 py-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50"
                    placeholder="••••••••"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors"
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
                className="text-sm font-medium text-primary hover:text-secondary-container transition-all order-2 md:order-1 font-body"
                to="/login"
              >
                Already have an account? <span className="underline underline-offset-4">Log in</span>
              </Link>
              <button
                className="signature-gradient text-on-primary w-full md:w-auto px-10 py-4 rounded-xl text-[0.75rem] uppercase tracking-widest font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform order-1 md:order-2 font-label disabled:opacity-60 disabled:cursor-not-allowed"
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
          <footer className="mt-12 pt-8 border-t border-surface-container">
            <p className="text-[0.7rem] text-on-surface-variant/60 text-center leading-relaxed font-body">
              By signing up, you agree to StudySync's{" "}
              <a className="underline hover:text-primary" href="#">
                terms of service
              </a>{" "}
              and{" "}
              <a className="underline hover:text-primary" href="#">
                privacy policy
              </a>
              .
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
        <div className="glass-effect fixed bottom-12 right-12 max-w-[240px] p-6 rounded-2xl shadow-[0_20px_40px_rgba(19,30,25,0.06)] z-20 hidden md:block">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-container/30 rounded-full text-primary">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <p className="text-[0.75rem] leading-relaxed text-on-surface font-body font-medium">
              Your data is only used to help you stay on track. Privacy is our priority.
            </p>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
        <span className="text-[0.75rem] uppercase tracking-[0.2em] font-bold text-primary opacity-40 font-headline">
          StudySync
        </span>
      </div>
    </div>
  );
}
