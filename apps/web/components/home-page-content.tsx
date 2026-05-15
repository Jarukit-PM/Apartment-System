"use client";

import Link from "next/link";
import { useState } from "react";
import { routing } from "@/i18n/routing";
import { writeNextIntlLocaleCookie } from "@/lib/write-next-intl-locale-cookie";

type HomeCopy = {
  brand: string;
  heading: string;
  intro: string;
  language: string;
  openConsole: string;
  myPortal: string;
  signIn: string;
};

type Locale = (typeof routing.locales)[number];

const localeLabels: Record<Locale, string> = {
  en: "English",
  th: "ไทย",
};

type Props = {
  initialLocale: string;
  copy: Record<Locale, HomeCopy>;
  hero?: boolean;
};

export function HomePageContent({ initialLocale, copy, hero = false }: Props) {
  const resolved: Locale = (routing.locales as readonly string[]).includes(initialLocale)
    ? (initialLocale as Locale)
    : routing.defaultLocale;

  const [active, setActive] = useState<Locale>(resolved);
  const t = copy[active];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p data-hero="eyebrow" className="ap-eyebrow">
          {t.brand}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t.language}</span>
          <div className="flex rounded-full border border-[var(--ap-border)] bg-[var(--ap-surface-solid)] p-0.5">
            {routing.locales.map((loc) => (
              <button
                key={loc}
                type="button"
                disabled={active === loc}
                onClick={() => {
                  if (loc === active) return;
                  setActive(loc);
                  requestAnimationFrame(() => {
                    writeNextIntlLocaleCookie(loc);
                  });
                }}
                className={
                  active === loc
                    ? "cursor-default rounded-full bg-gradient-to-r from-[var(--ap-gold-light)] to-[var(--ap-accent)] px-3 py-1 text-xs font-semibold text-[#1c1916]"
                    : "rounded-full px-3 py-1 text-xs font-medium text-[var(--ap-muted)] transition hover:text-[var(--foreground)]"
                }
              >
                {localeLabels[loc]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <h1
        data-hero="title"
        className={hero ? "ap-display mt-4" : "ap-headline mt-2"}
      >
        {t.heading}
      </h1>
      <p data-hero="intro" className="ap-body mt-4">
        {t.intro}
      </p>
      <div data-hero="actions" className="mt-10 flex flex-col gap-3">
        <Link
          prefetch={false}
          href="/dashboard"
          className="ap-btn ap-btn-primary w-full"
        >
          {t.openConsole}
        </Link>
        <Link
          prefetch={false}
          href="/my"
          className="ap-btn ap-btn-secondary w-full"
        >
          {t.myPortal}
        </Link>
        <Link prefetch={false} href="/login" className="ap-btn ap-btn-ghost w-full text-center">
          {t.signIn}
        </Link>
      </div>
    </>
  );
}
