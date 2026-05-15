import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { UnitImage } from "@/components/entity-image";
import { PageHeader } from "@/components/page-header";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, Property, Unit } from "@/lib/types";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ propertyId?: string }>;
};

function unitRatesSummary(
  u: Unit,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const parts: string[] = [];
  if (u.listingRent) {
    parts.push(`${u.listingRent.amount} ${u.listingRent.currency}`);
  }
  const n = u.rentalPeriodOffers?.length ?? 0;
  if (n > 0) {
    parts.push(t("periodRatesCount", { count: n }));
  }
  return parts.length > 0 ? parts.join(" · ") : t("col.noListing");
}

export default async function UnitsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("UnitsPage");

  const [unitsRes, propsRes] = await Promise.all([
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties"),
  ]);

  const units = unitsRes.ok ? unitsRes.data.data : [];
  const properties = propsRes.ok ? propsRes.data.data : [];

  const filterPropertyId =
    sp.propertyId && properties.some((p) => p.id === sp.propertyId) ? sp.propertyId : null;

  const visibleProperties = filterPropertyId
    ? properties.filter((p) => p.id === filterPropertyId)
    : properties;

  const unitsByProperty = new Map<string, Unit[]>();
  for (const u of units) {
    const list = unitsByProperty.get(u.propertyId) ?? [];
    list.push(u);
    unitsByProperty.set(u.propertyId, list);
  }

  const newUnitHref = filterPropertyId
    ? `/units/new?propertyId=${encodeURIComponent(filterPropertyId)}`
    : "/units/new";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <Link href={newUnitHref} className="ap-btn ap-btn-primary shrink-0 self-start">
          {t("addUnitCta")}
        </Link>
      </div>

      {filterPropertyId ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--ap-muted)]">{t("filteredBy")}</span>
          <span className="rounded-full border border-[var(--ap-border)] bg-[var(--ap-surface-solid)] px-3 py-1 font-medium text-[var(--foreground)]">
            {properties.find((p) => p.id === filterPropertyId)?.name}
          </span>
          <Link href="/units" className="text-[var(--ap-gold-deep)] hover:underline">
            {t("clearFilter")}
          </Link>
        </div>
      ) : null}

      {!unitsRes.ok || !propsRes.ok ? (
        <p className="text-sm text-red-600">{t("listError")}</p>
      ) : visibleProperties.length === 0 ? (
        <p className="text-sm text-[var(--ap-muted)]">{t("noProperties")}</p>
      ) : units.length === 0 ? (
        <div className="ap-card p-8 text-center">
          <p className="text-sm text-[var(--ap-muted)]">{t("empty")}</p>
          <Link href={newUnitHref} className="ap-btn ap-btn-secondary mt-4 inline-flex">
            {t("addUnitCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleProperties.map((property) => {
            const propertyUnits = (unitsByProperty.get(property.id) ?? []).sort((a, b) =>
              a.label.localeCompare(b.label),
            );
            const sectionNewHref = `/units/new?propertyId=${encodeURIComponent(property.id)}`;

            return (
              <section key={property.id} className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-lg font-semibold tracking-tight text-[var(--foreground)] hover:text-[var(--ap-accent)]"
                    >
                      {property.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-[var(--ap-muted)]">
                      {propertyUnits.length === 0
                        ? t("propertyNoUnits")
                        : t("propertyUnitCount", { count: propertyUnits.length })}
                    </p>
                  </div>
                  <Link
                    href={sectionNewHref}
                    className="text-sm font-medium text-[var(--ap-gold-deep)] hover:underline"
                  >
                    + {t("addUnitToProperty")}
                  </Link>
                </div>

                {propertyUnits.length === 0 ? (
                  <p className="ap-card px-5 py-4 text-sm text-[var(--ap-muted)]">{t("propertyNoUnits")}</p>
                ) : (
                  <ul className="ap-card divide-y divide-[var(--ap-border)] overflow-hidden">
                    {propertyUnits.map((u) => (
                      <li key={u.id}>
                        <Link
                          href={`/units/${u.id}`}
                          className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[#faf8f5] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <UnitImage
                            label={u.label}
                            imageUrl={u.imageUrl}
                            propertyImageUrl={property.imageUrl}
                            className="hidden w-16 shrink-0 sm:block"
                            aspect="square"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-[var(--foreground)]">{u.label}</span>
                            <p className="mt-0.5 text-xs text-[var(--ap-muted)]">
                              {u.floor != null ? t("floorLine", { floor: u.floor }) : null}
                              {u.floor != null && u.bedrooms != null ? " · " : null}
                              {u.bedrooms != null ? t("bedroomsLine", { count: u.bedrooms }) : null}
                              {(u.floor != null || u.bedrooms != null) && " · "}
                              <span className="capitalize">{u.status}</span>
                            </p>
                          </div>
                          <p className="text-sm text-[var(--ap-muted)] sm:text-right">
                            {unitRatesSummary(u, t)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
