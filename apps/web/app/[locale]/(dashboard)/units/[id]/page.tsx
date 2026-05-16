import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { PeriodOfferFields } from "@/components/units/period-offer-fields";
import { EntityImageUpload } from "@/components/entities/entity-image-upload";
import { UnitImage } from "@/components/entities/entity-image";
import { UnitOccupancyCalendar } from "@/components/occupancy/unit-occupancy-calendar";
import { patchUnit, removeUnitImage, uploadUnitImage } from "@/lib/actions/portal";
import { apiGetJsonAuthed } from "@/lib/api/server";
import { leasesToOccupancy, residentNameMap } from "@/lib/domain/unit-occupancy";
import type { Lease, ListWrapper, Property, Resident, SingleWrapper, Unit } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string; id: string }> };

function unitRatesMetaLine(
  u: Unit,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const hasFlat = u.listingRent != null && u.listingRent.amount > 0;
  const n = u.rentalPeriodOffers?.length ?? 0;
  if (!hasFlat && n === 0) return t("noPublishedRatesMeta");
  const parts: string[] = [];
  if (hasFlat && u.listingRent) {
    parts.push(
      t("metaFlatSnippet", {
        amount: u.listingRent.amount,
        currency: u.listingRent.currency,
      }),
    );
  }
  if (n > 0) {
    parts.push(t("metaPeriodsSnippet", { count: n }));
  }
  return parts.join(" · ");
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UnitsPage");

  const [unitRes, leasesRes, residentsRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<Unit>>(`/v1/units/${id}`),
    apiGetJsonAuthed<ListWrapper<Lease>>(`/v1/leases?unitId=${encodeURIComponent(id)}`),
    apiGetJsonAuthed<ListWrapper<Resident>>("/v1/residents"),
  ]);
  if (!unitRes.ok) {
    if (unitRes.status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <Link href="/units" className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <h1 className="ap-headline">{t("fetchErrorTitle")}</h1>
        <p className="ap-body text-sm">{unitRes.error?.message ?? t("fetchErrorBody")}</p>
      </div>
    );
  }

  const unit = unitRes.data.data;
  const propsRes = await apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties");
  const property = propsRes.ok ? propsRes.data.data.find((p) => p.id === unit.propertyId) : undefined;
  const propertyName = property?.name;

  const residents = residentsRes.ok ? residentsRes.data.data : [];
  const occupancyLeases = leasesRes.ok
    ? leasesToOccupancy(leasesRes.data.data, residentNameMap(residents))
    : [];
  const weekdays =
    locale === "th"
      ? [
          t("occupancyWeekMon"),
          t("occupancyWeekTue"),
          t("occupancyWeekWed"),
          t("occupancyWeekThu"),
          t("occupancyWeekFri"),
          t("occupancyWeekSat"),
          t("occupancyWeekSun"),
        ]
      : [
          t("occupancyWeekSun"),
          t("occupancyWeekMon"),
          t("occupancyWeekTue"),
          t("occupancyWeekWed"),
          t("occupancyWeekThu"),
          t("occupancyWeekFri"),
          t("occupancyWeekSat"),
        ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/units" className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <PageHeader title={unit.label} subtitle={t("editSubtitle")} />
        <p className="mt-1 text-sm text-[var(--ap-muted)]">
          {propertyName ? (
            <>
              {t("atProperty")}{" "}
              <Link
                href={`/properties/${unit.propertyId}`}
                className="font-medium text-[var(--ap-gold-deep)] hover:underline"
              >
                {propertyName}
              </Link>
            </>
          ) : (
            <span className="font-mono text-xs">{unit.propertyId}</span>
          )}
          <span className="mx-2">·</span>
          <span>{unit.status}</span>
        </p>
        <p className="mt-1 font-mono text-xs text-[var(--ap-muted)]">{unit.id}</p>
      </div>

      {unit.listingRent ? (
        <p className="text-sm text-[var(--ap-muted)]">
          {t("listingLine", {
            amount: unit.listingRent.amount,
            currency: unit.listingRent.currency,
          })}
        </p>
      ) : null}

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("imageSection")}</h2>
        <UnitImage
          label={unit.label}
          imageUrl={unit.imageUrl}
          propertyImageUrl={property?.imageUrl}
          className="mt-4 max-w-md"
        />
        <div className="mt-4 max-w-md">
          <EntityImageUpload
            action={uploadUnitImage}
            locale={locale}
            entityId={unit.id}
            entityField="unitId"
            propertyId={unit.propertyId}
            hasImage={Boolean(unit.imageUrl)}
            removeAction={removeUnitImage}
            labels={{
              file: t("imageFile"),
              submit: t("imageUpload"),
              remove: t("imageRemove"),
              hint: t("imageHint"),
            }}
          />
        </div>
      </section>

      <section className="ap-card p-6 md:p-8">
        {!leasesRes.ok ? (
          <p className="text-sm text-red-600">{t("occupancyLoadError")}</p>
        ) : occupancyLeases.length === 0 ? (
          <div>
            <h2 className="ap-eyebrow">{t("occupancyTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--ap-muted)]">{t("occupancyEmpty")}</p>
          </div>
        ) : (
          <UnitOccupancyCalendar
            locale={locale}
            leases={occupancyLeases}
            labels={{
              title: t("occupancyTitle"),
              subtitle: t("occupancySubtitle"),
              prevMonth: t("occupancyPrevMonth"),
              nextMonth: t("occupancyNextMonth"),
              vacancy: t("occupancyVacancy"),
              moreResidents: t("occupancyMoreResidents"),
              openEnded: t("occupancyOpenEnded"),
              leaseListTitle: t("occupancyLeaseList"),
              statusActive: t("occupancyStatusActive"),
              statusEnded: t("occupancyStatusEnded"),
              statusDraft: t("occupancyStatusDraft"),
              weekdays,
            }}
          />
        )}
      </section>

      <section className="ap-card p-6 md:p-8">
        <details className="rounded-lg border border-[var(--ap-border)] bg-[#faf8f5] open:shadow-sm" open>
          <summary className="cursor-pointer select-none list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {t("unitRatesFoldTitle")}
            </span>
            <span className="mt-0.5 block text-xs text-[var(--ap-muted)]">
              {unitRatesMetaLine(unit, t)}
            </span>
          </summary>
          <div className="border-t border-[var(--ap-border)] px-3 pb-4 pt-4">
            <ActionForm action={patchUnit} locale={locale} submitLabel={t("saveListing")}>
              <input type="hidden" name="unitId" value={unit.id} />
              <input type="hidden" name="propertyId" value={unit.propertyId} />
              <input type="hidden" name="selfServiceUpdate" value="1" />
              <input type="hidden" name="periodOffersUpdate" value="1" />
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="listingAmount" className="ap-label">
                      {t("listingAmount")}
                    </label>
                    <input
                      id="listingAmount"
                      name="listingAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={t("listingAmountPh")}
                      defaultValue={unit.listingRent?.amount ?? ""}
                      className="ap-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="listingCurrency" className="ap-label">
                      {t("listingCurrency")}
                    </label>
                    <input
                      id="listingCurrency"
                      name="listingCurrency"
                      defaultValue={unit.listingRent?.currency ?? "THB"}
                      className="ap-input"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      id="selfService"
                      name="selfService"
                      type="checkbox"
                      defaultChecked={unit.selfServiceEnabled ?? false}
                      className="h-4 w-4 rounded border-[var(--ap-border-strong)]"
                    />
                    <label htmlFor="selfService" className="text-sm text-[var(--foreground)]">
                      {t("selfService")}
                    </label>
                  </div>
                </div>
                <PeriodOfferFields
                  t={t}
                  idPrefix={`unit-${unit.id}`}
                  offers={unit.rentalPeriodOffers}
                />
              </div>
            </ActionForm>
          </div>
        </details>
      </section>
    </div>
  );
}
