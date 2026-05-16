/** Format satang as THB currency for display. */
export function formatThb(satang: number, locale: string): string {
  const baht = satang / 100;
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht);
}
