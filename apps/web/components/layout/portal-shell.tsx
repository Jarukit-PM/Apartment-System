"use client";

import { Building2, PanelLeftClose } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, type ReactNode } from "react";
import { PortalTopBar } from "@/components/layout/portal-top-bar";
import type { PortalNavSection } from "@/components/layout/portal-nav";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";

type ShellLabels = {
  openMenuLabel: string;
  closeMenuLabel: string;
  sidebarLabel: string;
  breadcrumbLabel: string;
  detailsLabel: string;
};

type Props = {
  brand: string;
  title: string;
  homeHref: string;
  navSections: PortalNavSection[];
  nav: ReactNode;
  sidebarFooter: ReactNode;
  topBarActions?: ReactNode;
  children: ReactNode;
} & ShellLabels;

function PortalSidebarPanel({
  brand,
  title,
  homeHref,
  nav,
  sidebarFooter,
  closeMenuLabel,
  onCloseDesktop,
}: {
  brand: string;
  title: string;
  homeHref: string;
  nav: ReactNode;
  sidebarFooter: ReactNode;
  closeMenuLabel: string;
  onCloseDesktop: () => void;
}) {
  return (
  <>
      <div className="mb-4 hidden items-center gap-2 md:flex">
        <Link href={homeHref} className="ap-sidebar-brand !mb-0 min-w-0 flex-1">
          <span className="ap-icon-tile shrink-0" aria-hidden>
            <Building2 className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 ap-sidebar-brand-text">
            <p className="ap-eyebrow">{brand}</p>
            <p className="mt-0.5 text-[1rem] font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </p>
          </div>
        </Link>
        <button
          type="button"
          className="ap-sidebar-menu-btn shrink-0"
          onClick={onCloseDesktop}
          aria-label={closeMenuLabel}
          title={closeMenuLabel}
        >
          <PanelLeftClose className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="ap-sidebar-nav-scroll">{nav}</div>

      <div className="ap-sidebar-footer">{sidebarFooter}</div>
    </>
  );
}

function PortalShellInner({
  brand,
  title,
  homeHref,
  navSections,
  nav,
  sidebarFooter,
  topBarActions,
  children,
  openMenuLabel,
  closeMenuLabel,
  sidebarLabel,
  breadcrumbLabel,
  detailsLabel,
}: Props) {
  const pathname = usePathname();
  const {
    isMobile,
    mobileOpen,
    setMobileOpen,
    toggleMobile,
    desktopOpen,
    setDesktopOpen,
  } = useSidebar();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, setMobileOpen]);

  const sidebarVisibleOnDesktop = desktopOpen;
  const showMenuButton = isMobile || !sidebarVisibleOnDesktop;
  const menuExpanded = isMobile && mobileOpen;

  const desktopSidebarClass = [
    "ap-sidebar",
    !sidebarVisibleOnDesktop ? "ap-sidebar-desktop-closed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mobileSidebarClass = "ap-sidebar ap-portal-sidebar-drawer ap-sidebar-open";

  const handleMenuClick = () => {
    if (isMobile) {
      toggleMobile();
      return;
    }
    setDesktopOpen(true);
  };

  const mainContentClass = [
    "flex-1 px-5 py-6 md:px-12 md:py-10",
    mobileOpen ? "max-md:pointer-events-none" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sidebarPanel = (
    <PortalSidebarPanel
      brand={brand}
      title={title}
      homeHref={homeHref}
      nav={nav}
      sidebarFooter={sidebarFooter}
      closeMenuLabel={closeMenuLabel}
      onCloseDesktop={() => setDesktopOpen(false)}
    />
  );

  return (
    <div className="ap-ambient-bg flex min-h-dvh flex-col md:flex-row">
      {/* Desktop: in-flow sidebar on the left */}
      <aside
        id="portal-sidebar"
        aria-label={sidebarLabel}
        aria-hidden={!sidebarVisibleOnDesktop ? true : undefined}
        className={`${desktopSidebarClass} hidden shrink-0 md:flex`}
      >
        <div className="ap-sidebar-inner">{sidebarPanel}</div>
      </aside>

      <div className="ap-portal-main flex min-h-0 min-w-0 flex-1 flex-col">
        <PortalTopBar
          homeHref={homeHref}
          consoleTitle={title}
          sections={navSections}
          breadcrumbLabel={breadcrumbLabel}
          detailsLabel={detailsLabel}
          openMenuLabel={openMenuLabel}
          closeMenuLabel={closeMenuLabel}
          menuExpanded={menuExpanded}
          showMenuButton={showMenuButton}
          onMenuClick={handleMenuClick}
          actions={topBarActions}
        />
        <main className={mainContentClass}>{children}</main>
      </div>

      {/* Mobile: fixed drawer + scrim (after main in DOM for stacking) */}
      {isMobile && mobileOpen ? (
        <>
          <button
            type="button"
            className="ap-portal-scrim bg-[#1c1916]/40 backdrop-blur-[2px]"
            aria-label={closeMenuLabel}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="portal-sidebar-mobile"
            aria-label={sidebarLabel}
            className={`${mobileSidebarClass} ap-sidebar-open`}
          >
            <div className="ap-sidebar-inner h-full">{sidebarPanel}</div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

export function PortalShell(props: Props) {
  return (
    <SidebarProvider>
      <PortalShellInner {...props} />
    </SidebarProvider>
  );
}
