import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/action-form";
import { createUnit, patchUnit } from "@/lib/portal-actions";
import {
  isPeriodEnabledInOffers,
  offerAmountDefault,
  offersCurrencyDefault,
  RENTAL_PERIOD_IDS,
} from "@/lib/rental-periods";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, Property, SingleWrapper, Unit } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string; id: string }> };

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

function unitRatesMetaLine(
  u: Unit,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const hasFlat = u.listingRent != null && u.listingRent.amount > 0;
  const n = u.rentalPeriodOffers?.length ?? 0;
  if (!hasFlat && n === 0) return t("noPublishedRatesMeta");
  const parts: string[] = [];
  if (hasFlat && u.listingRent) {
    parts.push(t("metaFlatSnippet", { amount: u.listingRent.amount, currency: u.listingRent.currency }));
  }
  if (n > 0) parts.push(t("metaPeriodsSnippet", { count: n }));
  return parts.join(" · ");
}

function PeriodOfferFields({
  t,
  idPrefix,
  offers,
}: {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  idPrefix: string;
  offers?: { periodId: string; amount: number; currency: string }[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t("periodPricesTitle")}</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("periodPricesHint")}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <label htmlFor={`${rowId}-en`} className="text-zinc-800 dark:text-zinc-200">
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
                      className="w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="max-w-xs">
        <label
          htmlFor={`${idPrefix}-offers-cur`}
          className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          {t("offersCurrency")}
        </label>
        <input
          id={`${idPrefix}-offers-cur`}
          name="offersCurrency"
          defaultValue={offersCurrencyDefault(offers)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PropertyDetailPage");

  const [propRes, unitsRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<Property>>(`/v1/properties/${id}`),
    apiGetJsonAuthed<ListWrapper<Unit>>(`/v1/units?propertyId=${encodeURIComponent(id)}`),
  ]);

  if (!propRes.ok) {
    if (propRes.status === 404) {
      notFound();
    }
    const tAuth = await getTranslations("Auth");
    const nextPath = `/${locale}/properties/${id}`;
    const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <Link href="/properties" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← {t("back")}
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("fetchErrorTitle")}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {propRes.error?.message ?? t("fetchErrorBody")}
        </p>
        {propRes.status === 401 || propRes.status === 403 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Link href={loginHref} className="font-medium text-zinc-900 underline dark:text-zinc-100">
              {tAuth("signIn")}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  const property = propRes.data.data;
  const units = unitsRes.ok ? unitsRes.data.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Link href="/properties" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{property.name}</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{property.id}</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("addUnit")}</h2>
        <div className="mt-4 max-w-2xl">
          <ActionForm action={createUnit} locale={locale} submitLabel={t("addUnitSubmit")}>
            <input type="hidden" name="propertyId" value={id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="label" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("label")}
                </label>
                <input
                  id="label"
                  name="label"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label htmlFor="floor" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("floor")}
                </label>
                <input
                  id="floor"
                  name="floor"
                  type="number"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("bedrooms")}
                </label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("status")}
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="vacant"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                >
                  <option value="vacant">vacant</option>
                  <option value="occupied">occupied</option>
                  <option value="maintenance">maintenance</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="listingAmount"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("listingAmount")}
                </label>
                <input
                  id="listingAmount"
                  name="listingAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t("listingAmountPh")}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label
                  htmlFor="listingCurrency"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("listingCurrency")}
                </label>
                <input
                  id="listingCurrency"
                  name="listingCurrency"
                  defaultValue="THB"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="selfService"
                  name="selfService"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="selfService" className="text-sm text-zinc-700 dark:text-zinc-300">
                  {t("selfService")}
                </label>
              </div>
              <div className="sm:col-span-2">
                <details
                  className="rounded-lg border border-zinc-200 bg-zinc-50/90 open:shadow-sm dark:border-zinc-700 dark:bg-zinc-950/60"
                  open
                >
                  <summary className="cursor-pointer select-none list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {t("foldPeriodSectionCreate")}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {t("foldPeriodSectionHint")}
                    </span>
                  </summary>
                  <div className="border-t border-zinc-200 px-3 pb-3 pt-2 dark:border-zinc-800">
                    <PeriodOfferFields t={t} idPrefix="create" />
                  </div>
                </details>
              </div>
            </div>
          </ActionForm>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("unitsTitle")}</h2>
        {!unitsRes.ok ? (
          <p className="mt-4 text-sm text-red-600">{t("unitsError")}</p>
        ) : units.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("unitsEmpty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {units.map((u) => (
              <li key={u.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {u.label}{" "}
                      <span className="text-sm font-normal text-zinc-500">({u.status})</span>
                    </p>
                    <p className="font-mono text-xs text-zinc-500">{u.id}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.listingRent ? (
                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-200">
                          {t("metaFlatSnippet", {
                            amount: u.listingRent.amount,
                            currency: u.listingRent.currency,
                          })}
                        </span>
                      ) : null}
                      {u.rentalPeriodOffers?.map((o) => (
                        <span
                          key={o.periodId}
                          className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-100"
                        >
                          {o.periodId} · {o.amount} {o.currency}
                        </span>
                      ))}
                      {!u.listingRent && !(u.rentalPeriodOffers && u.rentalPeriodOffers.length > 0) ? (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{t("noPublishedRatesMeta")}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <details className="group -mx-4 mt-3 border-t border-zinc-100 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/25">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-left marker:content-none [&::-webkit-details-marker]:hidden hover:bg-zinc-100/80 dark:hover:bg-zinc-900/40">
                    <span className="min-w-0">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {t("unitRatesFoldTitle")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {unitRatesMetaLine(u, t)}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-xs text-zinc-400 transition-transform group-open:rotate-90 dark:text-zinc-500"
                      aria-hidden
                    >
                      ▶
                    </span>
                  </summary>
                  <div className="border-t border-zinc-100 bg-white px-4 pb-4 pt-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <ActionForm action={patchUnit} locale={locale} submitLabel={t("saveListing")}>
                      <input type="hidden" name="unitId" value={u.id} />
                      <input type="hidden" name="propertyId" value={id} />
                      <input type="hidden" name="selfServiceUpdate" value="1" />
                      <input type="hidden" name="periodOffersUpdate" value="1" />
                      <div className="space-y-4">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <label className="sr-only" htmlFor={`la-${u.id}`}>
                              {t("listingAmount")}
                            </label>
                            <input
                              id={`la-${u.id}`}
                              name="listingAmount"
                              type="number"
                              min={0}
                              step="0.01"
                              defaultValue={u.listingRent?.amount ?? ""}
                              placeholder={t("listingAmountPh")}
                              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                            />
                          </div>
                          <div>
                            <label className="sr-only" htmlFor={`lc-${u.id}`}>
                              {t("listingCurrency")}
                            </label>
                            <input
                              id={`lc-${u.id}`}
                              name="listingCurrency"
                              defaultValue={u.listingRent?.currency ?? "THB"}
                              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                            />
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-3">
                            <input
                              id={`ss-${u.id}`}
                              name="selfService"
                              type="checkbox"
                              defaultChecked={u.selfServiceEnabled !== false}
                              className="h-4 w-4 rounded border-zinc-300"
                            />
                            <label htmlFor={`ss-${u.id}`} className="text-sm text-zinc-700 dark:text-zinc-300">
                              {t("selfService")}
                            </label>
                          </div>
                        </div>
                        <PeriodOfferFields t={t} idPrefix={u.id} offers={u.rentalPeriodOffers} />
                      </div>
                    </ActionForm>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
