/** Locale-aware date for profile and lease displays. */
export function formatLocaleDate(iso: string, locale: string): string {
  try {
    const tag = locale === "th" ? "th-TH" : "en-US";
    return new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
