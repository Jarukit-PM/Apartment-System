"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "ap-portal-sidebar-open";

type SidebarContextValue = {
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  desktopOpen: boolean;
  setDesktopOpen: (open: boolean) => void;
  toggleDesktop: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

type ProviderProps = {
  children: ReactNode;
};

function readStoredDesktopOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const storedOpen = localStorage.getItem(STORAGE_KEY);
    if (storedOpen !== null) return storedOpen === "true";
  } catch {
    /* ignore */
  }
  return true;
}

export function SidebarProvider({ children }: ProviderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(readStoredDesktopOpen);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMobile(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(desktopOpen));
    } catch {
      /* ignore */
    }
  }, [desktopOpen]);

  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);
  const toggleDesktop = useCallback(() => setDesktopOpen((o) => !o), []);

  const value = useMemo(
    () => ({
      isMobile,
      mobileOpen,
      setMobileOpen,
      toggleMobile,
      desktopOpen,
      setDesktopOpen,
      toggleDesktop,
    }),
    [isMobile, mobileOpen, toggleMobile, desktopOpen, toggleDesktop],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
