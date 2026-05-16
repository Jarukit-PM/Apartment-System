import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { PeriodOfferFields } from "@/components/units/period-offer-fields";
import { createUnit } from "@/lib/actions/portal";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { ListWrapper, Property } from "@/lib/api/types";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ propertyId?: string }>;
};

export default async function NewUnitPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("UnitsPage");

  const propsRes = await apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties");
  const properties = propsRes.ok ? propsRes.data.data : [];
  const defaultPropertyId =
    sp.propertyId && properties.some((p) => p.id === sp.propertyId) ? sp.propertyId : "";

  const unitsBackHref = defaultPropertyId
    ? `/units?propertyId=${encodeURIComponent(defaultPropertyId)}`
    : "/units";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href={unitsBackHref} className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <PageHeader title={t("addUnitTitle")} />
      </div>

      <section className="ap-card p-6 md:p-8">
        {!propsRes.ok ? (
          <p className="text-sm text-red-600">{t("propertiesLoadError")}</p>
        ) : properties.length === 0 ? (
          <p className="text-sm text-[var(--ap-muted)]">
            {t("noProperties")}{" "}
            <Link href="/properties" className="font-medium text-[var(--ap-gold-deep)] hover:underline">
              {t("goToProperties")}
            </Link>
          </p>
        ) : (
          <ActionForm action={createUnit} locale={locale} submitLabel={t("addUnitSubmit")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="propertyId" className="ap-label">
                  {t("propertyLabel")}
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  defaultValue={defaultPropertyId}
                  className="ap-input"
                >
                  <option value="">{t("propertyPlaceholder")}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="label" className="ap-label">
                  {t("unitLabel")}
                </label>
                <input id="label" name="label" required className="ap-input" />
              </div>
              <div>
                <label htmlFor="floor" className="ap-label">
                  {t("floor")}
                </label>
                <input id="floor" name="floor" type="number" className="ap-input" />
              </div>
              <div>
                <label htmlFor="bedrooms" className="ap-label">
                  {t("bedrooms")}
                </label>
                <input id="bedrooms" name="bedrooms" type="number" className="ap-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="status" className="ap-label">
                  {t("status")}
                </label>
                <select id="status" name="status" defaultValue="vacant" className="ap-input">
                  <option value="vacant">vacant</option>
                  <option value="occupied">occupied</option>
                  <option value="maintenance">maintenance</option>
                </select>
              </div>
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
                  defaultValue="THB"
                  className="ap-input"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="selfService"
                  name="selfService"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-[var(--ap-border-strong)]"
                />
                <label htmlFor="selfService" className="text-sm text-[var(--foreground)]">
                  {t("selfService")}
                </label>
              </div>
              <div className="sm:col-span-2">
                <details className="rounded-lg border border-[var(--ap-border)] bg-[#faf8f5] open:shadow-sm" open>
                  <summary className="cursor-pointer select-none list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {t("foldPeriodSectionCreate")}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--ap-muted)]">
                      {t("foldPeriodSectionHint")}
                    </span>
                  </summary>
                  <div className="border-t border-[var(--ap-border)] px-3 pb-3 pt-2">
                    <PeriodOfferFields t={t} idPrefix="create" />
                  </div>
                </details>
              </div>
            </div>
          </ActionForm>
        )}
      </section>
    </div>
  );
}
