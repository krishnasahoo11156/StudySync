import { createContext, useContext, useState, useCallback } from "react";

const ProfilePanelContext = createContext(null);

export function useProfilePanel() {
  const ctx = useContext(ProfilePanelContext);
  if (!ctx) throw new Error("useProfilePanel must be used within ProfilePanelProvider");
  return ctx;
}

export function ProfilePanelProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open  = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  return (
    <ProfilePanelContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </ProfilePanelContext.Provider>
  );
}
