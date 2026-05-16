/** Must match `services/api/internal/rentalperiod` catalog. */
export const RENTAL_PERIOD_IDS = ["7d", "15d", "1m", "2m", "3m", "6m", "1y", "2y"] as const;

export type RentalPeriodId = (typeof RENTAL_PERIOD_IDS)[number];

export type ParsedPeriodOffer = {
  periodId: string;
  amount: number;
  currency: string;
};

export type ParseRentalPeriodOffersResult =
  | { ok: true; offers: ParsedPeriodOffer[] }
  | { ok: false; error: string };

/**
 * Reads `offerEnabled_<periodId>` (checkbox "on"), `offerAmount_<periodId>`, and `offersCurrency`.
 * Only periods with the checkbox checked are included; each must have a positive amount.
 */
export function parseRentalPeriodOffersFromForm(formData: FormData): ParseRentalPeriodOffersResult {
  const cur = String(formData.get("offersCurrency") ?? "THB").trim() || "THB";
  const out: ParsedPeriodOffer[] = [];
  for (const id of RENTAL_PERIOD_IDS) {
    const enabled = formData.get(`offerEnabled_${id}`) === "on";
    if (!enabled) {
      continue;
    }
    const raw = String(formData.get(`offerAmount_${id}`) ?? "").trim();
    if (!raw) {
      return { ok: false, error: `Enter an amount for enabled period "${id}", or turn off that period.` };
    }
    const amt = Number(raw);
    if (Number.isNaN(amt) || amt <= 0) {
      return { ok: false, error: `Invalid amount for period "${id}".` };
    }
    out.push({ periodId: id, amount: amt, currency: cur });
  }
  return { ok: true, offers: out };
}

/** Default value for an amount input from existing unit offers. */
export function offerAmountDefault(
  offers: { periodId: string; amount: number }[] | undefined,
  periodId: string,
): string {
  if (!offers?.length) return "";
  const o = offers.find((x) => x.periodId === periodId);
  return o != null ? String(o.amount) : "";
}

/** Whether this period should show as "offered" in the admin form (existing saved rate). */
export function isPeriodEnabledInOffers(
  offers: { periodId: string; amount: number }[] | undefined,
  periodId: string,
): boolean {
  return offerAmountDefault(offers, periodId) !== "";
}

/** Shared currency default for period-offer inputs from existing offers. */
export function offersCurrencyDefault(offers: { currency?: string }[] | undefined): string {
  const c = offers?.find((x) => x.currency?.trim())?.currency?.trim();
  return c || "THB";
}
