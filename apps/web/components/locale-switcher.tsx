"use client";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";

const localeLabels: Record<(typeof routing.locales)[number], string> = {
  en: "English",
  th: "ไทย",
};

type Props = {
  label: string;
};

export function LocaleSwitcher({ label }: Props) {
  const pathname = usePathname();
  const active = useLocale();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
        {routing.locales.map((loc) => (
          <Link
            key={loc}
            href={pathname}
            locale={loc}
            className={
              active === loc
                ? "rounded-md bg-zinc-900 px-2.5 py-1 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded-md px-2.5 py-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }
            prefetch={false}
          >
            {localeLabels[loc]}
          </Link>
        ))}
      </div>
    </div>
  );
}
