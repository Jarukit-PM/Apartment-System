"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { logoutFormAction } from "@/lib/auth/actions";
import { writeNextIntlLocaleCookie } from "@/lib/i18n/write-locale-cookie";

type Locale = (typeof routing.locales)[number];

export type SidebarProfileUser = {
  displayName: string;
  email: string;
  isAdmin: boolean;
  isResident: boolean;
};

export type SidebarMenuLabels = {
  language: string;
  signOut: string;
  viewProfile: string;
  menuLabel: string;
  localeEn: string;
  localeTh: string;
};

type ExtraLink = { href: string; label: string };

type Props = {
  user: SidebarProfileUser;
  locale: string;
  labels: SidebarMenuLabels;
  profileHref?: string;
  extraLinks?: ExtraLink[];
};

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function IconSignOut() {
  return (
    <svg className="h-[1.125rem] w-[1.125rem] shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-[var(--ap-muted)] transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SidebarProfileMenu({ user, locale, labels, profileHref, extraLinks = [] }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const activeLocale: Locale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : routing.defaultLocale;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switchLocale = (loc: Locale) => {
    if (loc === activeLocale) return;
    writeNextIntlLocaleCookie(loc);
    router.refresh();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <div
          className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-[var(--ap-radius)] border border-[var(--ap-border)] bg-[var(--ap-surface-elevated)] py-1 shadow-[var(--ap-shadow-lg)]"
          role="menu"
          aria-label={labels.menuLabel}
        >
          <div className="border-b border-[var(--ap-border)] px-3 py-2.5">
            <p className="ap-eyebrow !text-[0.625rem]">{labels.language}</p>
            <div className="mt-2 flex gap-1 rounded-full border border-[var(--ap-border)] bg-[#faf8f5] p-0.5">
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeLocale === loc}
                  onClick={() => switchLocale(loc)}
                  className={
                    activeLocale === loc
                      ? "flex-1 rounded-full bg-gradient-to-r from-[var(--ap-gold-light)] to-[var(--ap-accent)] py-1 text-center text-xs font-semibold text-[#1c1916]"
                      : "flex-1 rounded-full py-1 text-center text-xs font-medium text-[var(--ap-muted)] hover:text-[var(--foreground)]"
                  }
                >
                  {loc === "en" ? labels.localeEn : labels.localeTh}
                </button>
              ))}
            </div>
          </div>

          {profileHref ? (
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--ap-accent-soft)]"
            >
              <span className="text-[var(--ap-gold-deep)]">◎</span>
              {labels.viewProfile}
            </Link>
          ) : null}

          {extraLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--ap-muted)] transition hover:bg-[var(--ap-accent-soft)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}

          <form action={logoutFormAction} className="border-t border-[var(--ap-border)]">
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <IconSignOut />
              {labels.signOut}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="group flex w-full items-center gap-3 rounded-[var(--ap-radius)] bg-[var(--ap-surface-solid)] p-3 text-left ring-1 ring-[var(--ap-border)] transition hover:ring-[var(--ap-accent)] hover:shadow-[var(--ap-shadow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ap-accent)]"
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ap-gold-light)] to-[var(--ap-accent)] text-sm font-semibold text-[#1c1916] shadow-sm"
          aria-hidden
        >
          {initials(user.displayName, user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {user.displayName}
          </p>
          <p className="truncate text-xs text-[var(--ap-muted)]">{user.email}</p>
        </div>
        <IconChevron open={open} />
      </button>
    </div>
  );
}
