"use client";

import { Building2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthLocaleSwitcher } from "@/components/auth/auth-locale-switcher";

type Props = {
  brand: string;
  homeHref?: string;
  languageLabel: string;
  signInLabel: string;
  registerLabel: string;
  /** Which auth page is active — shows the opposite link in the nav. */
  variant: "login" | "register";
};

export function SiteHeader({
  brand,
  homeHref = "/",
  languageLabel,
  signInLabel,
  registerLabel,
  variant,
}: Props) {
  return (
    <header className="ap-site-header">
      <div className="ap-site-header-inner">
        <Link href={homeHref} className="ap-site-header-brand">
          <span className="ap-icon-tile !h-9 !w-9 shrink-0" aria-hidden>
            <Building2 className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="truncate font-semibold tracking-tight text-[var(--foreground)]">{brand}</span>
        </Link>

        <nav className="ap-site-header-nav" aria-label={variant === "login" ? signInLabel : registerLabel}>
          <ul className="flex items-center gap-1 sm:gap-2" role="list">
            {variant === "login" ? (
              <li>
                <Link href="/register" className="ap-site-header-link">
                  {registerLabel}
                </Link>
              </li>
            ) : (
              <li>
                <Link href="/" className="ap-site-header-link">
                  {signInLabel}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="shrink-0">
          <AuthLocaleSwitcher label={languageLabel} />
        </div>
      </div>
    </header>
  );
}
