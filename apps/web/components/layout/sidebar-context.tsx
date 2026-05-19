"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

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

type DesktopOpenStore = {
  open: boolean;
  listeners: Set<() => void>;
};

let desktopOpenStore: DesktopOpenStore | null = null;

function getDesktopOpenStore(): DesktopOpenStore {
  if (!desktopOpenStore) {
    desktopOpenStore = {
      open: readStoredDesktopOpen(),
      listeners: new Set(),
    };
  }
  return desktopOpenStore;
}

function subscribeDesktopOpen(onStoreChange: () => void): () => void {
  const store = getDesktopOpenStore();
  store.listeners.add(onStoreChange);
  return () => store.listeners.delete(onStoreChange);
}

function getDesktopOpenSnapshot(): boolean {
  return getDesktopOpenStore().open;
}

function getDesktopOpenServerSnapshot(): boolean {
  return true;
}

function writeDesktopOpen(open: boolean): void {
  const store = getDesktopOpenStore();
  store.open = open;
  try {
    localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    /* ignore */
  }
  store.listeners.forEach((listener) => listener());
}

export function SidebarProvider({ children }: ProviderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopOpen = useSyncExternalStore(
    subscribeDesktopOpen,
    getDesktopOpenSnapshot,
    getDesktopOpenServerSnapshot,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMobile(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const setDesktopOpen = useCallback((open: boolean) => writeDesktopOpen(open), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);
  const toggleDesktop = useCallback(() => writeDesktopOpen(!getDesktopOpenSnapshot()), []);

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
    [isMobile, mobileOpen, toggleMobile, desktopOpen, setDesktopOpen, toggleDesktop],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
