import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionForm } from "@/components/action-form";
import { createResident } from "@/lib/portal-actions";
import { apiGetJson } from "@/lib/server-api";
import type { ListWrapper, Resident } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function ResidentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ResidentsPage");

  const res = await apiGetJson<ListWrapper<Resident>>("/v1/residents");
  const list = res.ok ? res.data.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("addTitle")}</h2>
        <div className="mt-4 max-w-lg">
          <ActionForm action={createResident} locale={locale} submitLabel={t("addSubmit")}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("fullName")}
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("phone")}
              </label>
              <input
                id="phone"
                name="phone"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="primaryUnitId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("primaryUnit")}
              </label>
              <input
                id="primaryUnitId"
                name="primaryUnitId"
                placeholder={t("primaryUnitPh")}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
          </ActionForm>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("listTitle")}</h2>
        {!res.ok ? (
          <p className="mt-4 text-sm text-red-600">{t("listError")}</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {list.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{r.fullName}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{r.email}</p>
                {r.primaryUnitId ? (
                  <p className="mt-1 font-mono text-xs text-zinc-500">{r.primaryUnitId}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
