import { getTranslations, setRequestLocale } from "next-intl/server";
import { Home } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UnitImage } from "@/components/entities/entity-image";
import { selfLeaseAction } from "@/lib/actions/resident-lease";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { AvailableUnit, ListWrapper } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyRentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal.rentBook");

  const res = await apiGetJsonAuthed<ListWrapper<AvailableUnit>>("/v1/me/available-units");

  if (!res.ok) {
    const detail = res.error?.message?.trim();
    const hint404 =
      res.status === 404
        ? t("loadError404Hint")
        : res.status === 403
          ? t("loadError403Hint")
          : null;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="ap-headline">{t("title")}</h1>
        <p className="ap-alert-error">{t("loadError")}</p>
        {detail ? (
          <p className="text-sm text-[var(--foreground)]" role="status">
            {detail} ({res.status})
          </p>
        ) : (
          <p className="text-sm text-[var(--ap-muted)]" role="status">
            {t("loadErrorStatus", { status: res.status })}
          </p>
        )}
        {hint404 ? <p className="text-sm text-[var(--ap-muted)]">{hint404}</p> : null}
      </div>
    );
  }

  const units = res.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={Home} />

      {units.length === 0 ? (
        <EmptyState icon={Home} title={t("empty")} />
      ) : (
        <ul className="space-y-6">
          {units.map((u) => {
            const offers = u.rentalPeriodOffers ?? [];
            const hasOffers = offers.length > 0;
            const hasListing = u.listingRent != null && u.listingRent.amount > 0;
            return (
            <li
              key={u.id}
              className="overflow-hidden ap-card"
            >
              <UnitImage
                label={u.label}
                imageUrl={u.imageUrl}
                propertyImageUrl={u.propertyImageUrl}
                className="rounded-none border-0 border-b border-[var(--ap-border)]"
              />
              <div className="p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {t("unitLabel", { label: u.label })}
                </h2>
                {hasListing ? (
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {t("rentLine", {
                      amount: u.listingRent!.amount,
                      currency: u.listingRent!.currency,
                    })}
                  </p>
                ) : null}
              </div>
              {hasOffers ? (
                <div className="mt-2">
                  <p className="ap-eyebrow">
                    {t("ratesByPeriod")}
                  </p>
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
              <p className="mt-1 text-sm text-[var(--ap-muted)]">
                {u.propertyName ?? u.propertyId}
                {u.floor != null ? ` · ${t("floor", { n: u.floor })}` : null}
                {u.bedrooms != null ? ` · ${t("bedrooms", { n: u.bedrooms })}` : null}
              </p>
              <div className="mt-4 border-t border-[var(--ap-border)] pt-4">
                <ActionForm action={selfLeaseAction} locale={locale} submitLabel={t("bookSubmit")}>
                  <input type="hidden" name="unitId" value={u.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {hasOffers ? (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`period-${u.id}`}
                          className="ap-label"
                        >
                          {t("periodLabel")}
                        </label>
                        <select
                          id={`period-${u.id}`}
                          name="periodId"
                          required
                          className="mt-1 w-full max-w-md ap-input"
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
                      <label
                        htmlFor={`start-${u.id}`}
                        className="ap-label"
                      >
                        {t("startLabel")}
                      </label>
                      <input
                        id={`start-${u.id}`}
                        name="startDate"
                        type="date"
                        required
                        className="mt-1 w-full max-w-md ap-input"
                      />
                      <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("dateHint")}</p>
                    </div>
                    {!hasOffers ? (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`end-${u.id}`}
                          className="ap-label"
                        >
                          {t("endLabel")}
                        </label>
                        <input
                          id={`end-${u.id}`}
                          name="endDate"
                          type="date"
                          className="mt-1 w-full max-w-md ap-input"
                        />
                        <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("endHint")}</p>
                      </div>
                    ) : null}
                  </div>
                </ActionForm>
              </div>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
