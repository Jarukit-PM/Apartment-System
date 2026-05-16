/** Format invoice amounts (major units, e.g. THB baht). */
export function formatInvoiceAmount(amount: number, currency: string, locale: string): string {
  const tag = locale === "th" ? "th-TH" : "en-US";
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency: currency || "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
