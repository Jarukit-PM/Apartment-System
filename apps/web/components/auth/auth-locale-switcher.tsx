"use client";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { writeNextIntlLocaleCookie } from "@/lib/i18n/write-locale-cookie";

const localeLabels: Record<(typeof routing.locales)[number], string> = {
  en: "English",
  th: "ไทย",
};

type Props = {
  label: string;
};

export function AuthLocaleSwitcher({ label }: Props) {
  const active = useLocale() as (typeof routing.locales)[number];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <div className="flex rounded-full border border-[var(--ap-border)] bg-[var(--ap-surface-solid)] p-0.5">
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            disabled={active === loc}
            onClick={() => {
              if (loc === active) return;
              writeNextIntlLocaleCookie(loc);
              window.location.reload();
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
  );
}
