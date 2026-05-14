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
};

export function HomePageContent({ initialLocale, copy }: Props) {
  const resolved: Locale = (routing.locales as readonly string[]).includes(initialLocale)
    ? (initialLocale as Locale)
    : routing.defaultLocale;

  const [active, setActive] = useState<Locale>(resolved);

  const t = copy[active];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t.brand}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t.language}</span>
          <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
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
                    ? "cursor-default rounded-md bg-zinc-900 px-2.5 py-1 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "rounded-md px-2.5 py-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-60 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                {localeLabels[loc]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t.heading}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t.intro}</p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          prefetch={false}
          href="/dashboard"
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {t.openConsole}
        </Link>
        <Link
          prefetch={false}
          href="/my"
          className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {t.myPortal}
        </Link>
        <Link
          prefetch={false}
          href="/login"
          className="text-center text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
        >
          {t.signIn}
        </Link>
      </div>
    </>
  );
}
