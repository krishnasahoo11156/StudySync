import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/* ═══════════════════════════════════════════
   THEME CONTEXT
   - Reads from localStorage first (instant, no flash)
   - Syncs with Firestore users/{uid}.preferences.darkMode
   - Adds/removes 'dark' class on <html>
   - 300ms smooth transition on every colour change
═══════════════════════════════════════════ */

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

const LS_KEY = "studysync-theme";

export function ThemeProvider({ children }) {
  /* Initialise from localStorage — synchronous to prevent first-render flash */
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === "dark";
    } catch {
      return false;
    }
  });

  /* Apply class + smooth-transition utility to <html> on every change */
  useEffect(() => {
    const root = document.documentElement;
    root.style.transition = "background-color 300ms ease, color 300ms ease";
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  /* Listen for Firestore preference sync dispatched by AuthContext */
  useEffect(() => {
    const handler = (e) => {
      const { darkMode } = e.detail || {};
      if (typeof darkMode !== "boolean") return;
      setIsDark(darkMode);
      try {
        localStorage.setItem(LS_KEY, darkMode ? "dark" : "light");
      } catch { /* ignore */ }
    };
    window.addEventListener("studysync-theme-sync", handler);
    return () => window.removeEventListener("studysync-theme-sync", handler);
  }, []);

  /* Sync from Firestore when user logs in (userUid passed from outside) */
  const syncFromFirestore = useCallback((darkModePref) => {
    if (typeof darkModePref !== "boolean") return;
    setIsDark(darkModePref);
    try {
      localStorage.setItem(LS_KEY, darkModePref ? "dark" : "light");
    } catch { /* ignore */ }
  }, []);

  /* Toggle — updates state, localStorage, and Firestore */
  const toggleTheme = useCallback(async (userUid) => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem(LS_KEY, next ? "dark" : "light");
    } catch { /* ignore */ }

    if (userUid) {
      try {
        await updateDoc(doc(db, "users", userUid), {
          "preferences.darkMode": next,
        });
      } catch (err) {
        console.warn("[ThemeContext] Firestore sync failed:", err.message);
      }
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, syncFromFirestore }}>
      {children}
    </ThemeContext.Provider>
  );
}
