import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [userProfile, setUserProfile] = useState(null); // Firestore users/{uid}

  /* ── Firebase Auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Firestore user doc listener (for extended profile + dark mode pref) ── */
  useEffect(() => {
    if (!user) { setUserProfile(null); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.exists() ? snap.data() : null;
      setUserProfile(data);

      /* Sync dark mode preference from Firestore → ThemeContext
         We do this lazily via a CustomEvent so we don't create a circular
         import between AuthContext and ThemeContext. */
      const darkModePref = data?.preferences?.darkMode;
      if (typeof darkModePref === "boolean") {
        window.dispatchEvent(
          new CustomEvent("studysync-theme-sync", { detail: { darkMode: darkModePref } })
        );
      }
    });
    return unsub;
  }, [user]);

  const logout = () => signOut(auth);

  /* Firestore photoURL takes precedence — allows storing base64 photos */
  const photoURL = userProfile?.photoURL || user?.photoURL || null;

  return (
    <AuthContext.Provider value={{ user, loading, logout, userProfile, photoURL }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
