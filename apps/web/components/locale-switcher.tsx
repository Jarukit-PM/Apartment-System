"use client";

import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { writeNextIntlLocaleCookie } from "@/lib/write-next-intl-locale-cookie";

type Locale = (typeof routing.locales)[number];

const localeLabels: Record<Locale, string> = {
  en: "EN",
  th: "TH",
};

type Props = {
  currentLocale: string;
  label: string;
  compact?: boolean;
};

export function LocaleSwitcher({ currentLocale, label, compact = false }: Props) {
  const router = useRouter();
  const active: Locale = (routing.locales as readonly string[]).includes(currentLocale)
    ? (currentLocale as Locale)
    : routing.defaultLocale;

  const switchLocale = (loc: Locale) => {
    if (loc === active) return;
    writeNextIntlLocaleCookie(loc);
    router.refresh();
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--ap-muted)]">
        {label}
      </p>
      <div
        className="flex rounded-full border border-[var(--ap-border)] bg-[var(--ap-surface-solid)] p-0.5"
        role="group"
        aria-label={label}
      >
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            disabled={active === loc}
            onClick={() => switchLocale(loc)}
            className={
              active === loc
                ? "flex-1 cursor-default rounded-full bg-gradient-to-r from-[var(--ap-gold-light)] to-[var(--ap-accent)] py-1.5 text-center text-xs font-semibold text-[#1c1916]"
                : "flex-1 rounded-full py-1.5 text-center text-xs font-medium text-[var(--ap-muted)] transition hover:text-[var(--foreground)]"
            }
          >
            {localeLabels[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
