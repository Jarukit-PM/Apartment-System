/** Locale-aware date for profile and lease displays. */
export function formatLocaleDate(iso: string, locale: string): string {
  try {
    const tag = locale === "th" ? "th-TH" : "en-US";
    return new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Formats lease `nextRentBillMonth` (`YYYY-MM`) for display. */
export function formatBillingMonth(ym: string, locale: string): string {
  const parts = ym.trim().split("-");
  if (parts.length < 2) return ym;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || month < 1 || month > 12) return ym;
  try {
    const tag = locale === "th" ? "th-TH" : "en-US";
    return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long" }).format(
      new Date(Date.UTC(year, month - 1, 1)),
    );
  } catch {
    return ym;
  }
}
