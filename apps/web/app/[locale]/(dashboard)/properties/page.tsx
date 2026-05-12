import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { createProperty, deleteProperty } from "@/lib/portal-actions";
import { apiGetJson } from "@/lib/server-api";
import type { ListWrapper, Property } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function PropertiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PropertiesPage");

  const res = await apiGetJson<ListWrapper<Property>>("/v1/properties");
  const list = res.ok ? res.data.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("addTitle")}</h2>
        <div className="mt-4 max-w-md">
          <ActionForm action={createProperty} locale={locale} submitLabel={t("addSubmit")}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("nameLabel")}
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
            {list.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/properties/${p.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs font-mono text-zinc-500">{p.id}</p>
                </div>
                <form action={deleteProperty} className="flex items-center gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={p.id} />
                  <SubmitButton label={t("delete")} variant="danger" />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
