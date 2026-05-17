"use client";

import { ActionForm } from "@/components/ui/action-form";
import { selfLeaseAction } from "@/lib/actions/resident-lease";
import type { AvailableUnit } from "@/lib/api/types";
import { useTranslations } from "next-intl";
import type { ActionFormSuccessLabels } from "@/components/ui/action-form";

type Props = {
  unit: AvailableUnit;
  locale: string;
  success: ActionFormSuccessLabels;
};

export function RentUnitBookingForm({ unit, locale, success }: Props) {
  const t = useTranslations("MyPortal.rentBook");
  const offers = unit.rentalPeriodOffers ?? [];
  const hasOffers = offers.length > 0;
  return (
    <div className="space-y-4">
      {hasOffers ? (
        <div>
          <p className="ap-eyebrow">{t("ratesByPeriod")}</p>
          <ul className="mt-1 list-inside list-disc text-sm text-[var(--foreground)]">
            {offers.map((o) => (
              <li key={o.periodId}>
                {t("rateRow", {
                  periodId: o.periodId,
                  amount: o.amount,
                  currency: o.currency,
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ActionForm action={selfLeaseAction} locale={locale} submitLabel={t("bookSubmit")} success={success}>
        <input type="hidden" name="unitId" value={unit.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          {hasOffers ? (
            <div className="sm:col-span-2">
              <label htmlFor={`period-${unit.id}`} className="ap-label">
                {t("periodLabel")}
              </label>
              <select
                id={`period-${unit.id}`}
                name="periodId"
                required
                className="mt-1 w-full ap-input"
                defaultValue=""
              >
                <option value="" disabled>
                  {t("periodPlaceholder")}
                </option>
                {offers.map((o) => (
                  <option key={o.periodId} value={o.periodId}>
                    {o.periodId} — {o.amount} {o.currency}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <label htmlFor={`start-${unit.id}`} className="ap-label">
              {t("startLabel")}
            </label>
            <input
              id={`start-${unit.id}`}
              name="startDate"
              type="date"
              required
              className="mt-1 w-full ap-input"
            />
            <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("dateHint")}</p>
          </div>
          {!hasOffers ? (
            <div className="sm:col-span-2">
              <label htmlFor={`end-${unit.id}`} className="ap-label">
                {t("endLabel")}
              </label>
              <input id={`end-${unit.id}`} name="endDate" type="date" className="mt-1 w-full ap-input" />
              <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("endHint")}</p>
            </div>
          ) : null}
        </div>
      </ActionForm>
    </div>
  );
}
