import {
  isPeriodEnabledInOffers,
  offerAmountDefault,
  offersCurrencyDefault,
  RENTAL_PERIOD_IDS,
} from "@/lib/rental-periods";

type Offer = { periodId: string; amount: number; currency: string };

function periodLabel(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  pid: (typeof RENTAL_PERIOD_IDS)[number],
): string {
  switch (pid) {
    case "7d":
      return t("period7d");
    case "15d":
      return t("period15d");
    case "1m":
      return t("period1m");
    case "2m":
      return t("period2m");
    case "3m":
      return t("period3m");
    case "6m":
      return t("period6m");
    case "1y":
      return t("period1y");
    case "2y":
      return t("period2y");
    default:
      return pid;
  }
}

type Props = {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  idPrefix: string;
  offers?: Offer[];
  translationNs?: "PropertyDetailPage" | "UnitsPage";
};

export function PeriodOfferFields({ t, idPrefix, offers }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-[var(--foreground)]">{t("periodPricesTitle")}</h3>
        <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("periodPricesHint")}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--ap-border)] bg-[var(--ap-surface-solid)]">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-[var(--ap-border)] bg-[#faf8f5] text-xs font-medium uppercase tracking-wide text-[var(--ap-muted)]">
            <tr>
              <th className="w-12 px-3 py-2" scope="col">
                {t("periodOfferCol")}
              </th>
              <th className="px-3 py-2" scope="col">
                {t("periodLengthCol")}
              </th>
              <th className="w-[min(40%,9rem)] px-3 py-2" scope="col">
                {t("periodPriceCol")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ap-border)]">
            {RENTAL_PERIOD_IDS.map((pid) => {
              const rowId = `${idPrefix}-row-${pid}`;
              return (
                <tr key={pid}>
                  <td className="px-3 py-2 align-middle">
                    <input
                      id={`${rowId}-en`}
                      type="checkbox"
                      name={`offerEnabled_${pid}`}
                      value="on"
                      defaultChecked={isPeriodEnabledInOffers(offers, pid)}
                      className="h-4 w-4 rounded border-[var(--ap-border-strong)] text-[var(--ap-accent)]"
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <label htmlFor={`${rowId}-en`} className="text-[var(--foreground)]">
                      {periodLabel(t, pid)}
                    </label>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <label htmlFor={`${rowId}-amt`} className="sr-only">
                      {t("periodPriceCol")} {periodLabel(t, pid)}
                    </label>
                    <input
                      id={`${rowId}-amt`}
                      name={`offerAmount_${pid}`}
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={offerAmountDefault(offers, pid)}
                      className="ap-input !py-1.5"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="max-w-xs">
        <label htmlFor={`${idPrefix}-offers-cur`} className="ap-label">
          {t("offersCurrency")}
        </label>
        <input
          id={`${idPrefix}-offers-cur`}
          name="offersCurrency"
          defaultValue={offersCurrencyDefault(offers)}
          className="ap-input"
        />
      </div>
    </div>
  );
}
