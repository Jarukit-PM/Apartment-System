import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "th"],
  defaultLocale: "en",
  /** Locale from `NEXT_LOCALE` cookie — URLs stay `/dashboard`, not `/en/dashboard`. */
  localePrefix: "never",
});
