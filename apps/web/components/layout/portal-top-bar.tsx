"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { resolveNavPage } from "@/lib/navigation/resolve-nav-page";
import type { PortalNavSection } from "@/components/layout/portal-nav";

type Props = {
  homeHref: string;
  consoleTitle: string;
  sections: PortalNavSection[];
  breadcrumbLabel: string;
  detailsLabel: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  menuExpanded: boolean;
  showMenuButton: boolean;
  onMenuClick: () => void;
  actions?: ReactNode;
};

export function PortalTopBar({
  homeHref,
  consoleTitle,
  sections,
  breadcrumbLabel,
  detailsLabel,
  openMenuLabel,
  closeMenuLabel,
  menuExpanded,
  showMenuButton,
  onMenuClick,
  actions,
}: Props) {
  const pathname = usePathname();
  const { title, crumbs } = resolveNavPage(pathname, sections, {
    fallbackTitle: consoleTitle,
    detailsLabel,
  });

  return (
    <header className="ap-topbar">
      <div className="ap-topbar-inner">
        {showMenuButton ? (
          <button
            type="button"
            className="ap-sidebar-menu-btn shrink-0"
            aria-expanded={menuExpanded}
            aria-controls="portal-sidebar"
            onClick={onMenuClick}
          >
            {menuExpanded ? (
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            )}
            <span className="sr-only">{menuExpanded ? closeMenuLabel : openMenuLabel}</span>
          </button>
        ) : (
          <span className="hidden w-10 shrink-0 md:block" aria-hidden />
        )}

        <nav className="min-w-0 flex-1" aria-label={breadcrumbLabel}>
          <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
            <li className="hidden min-w-0 sm:list-item">
              <Link
                href={homeHref}
                className="truncate font-medium text-[var(--ap-muted)] transition hover:text-[var(--foreground)]"
              >
                {consoleTitle}
              </Link>
            </li>
            {crumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                <li className="hidden items-center sm:flex" aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--ap-muted)]" />
                </li>
                <li className="min-w-0">
                  {crumb.href && index < crumbs.length - 1 ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-[var(--ap-muted)] transition hover:text-[var(--foreground)]"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className="block truncate font-semibold text-[var(--foreground)]"
                      aria-current={index === crumbs.length - 1 ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
          <p className="mt-0.5 truncate text-lg font-semibold tracking-tight text-[var(--foreground)] sm:hidden">
            {title}
          </p>
        </nav>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
