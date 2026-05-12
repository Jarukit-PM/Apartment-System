import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/action-form";
import { createUnit } from "@/lib/portal-actions";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, Property, SingleWrapper, Unit } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string; id: string }> };

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
        <div className="mt-4 max-w-lg">
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
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {u.label}{" "}
                  <span className="text-sm font-normal text-zinc-500">({u.status})</span>
                </p>
                <p className="font-mono text-xs text-zinc-500">{u.id}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
