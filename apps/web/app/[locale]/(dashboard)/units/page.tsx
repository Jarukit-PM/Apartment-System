import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, Property, Unit } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function UnitsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UnitsPage");

  const [unitsRes, propsRes] = await Promise.all([
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties"),
  ]);

  const units = unitsRes.ok ? unitsRes.data.data : [];
  const propMap = new Map<string, string>();
  if (propsRes.ok) {
    for (const p of propsRes.data.data) {
      propMap.set(p.id, p.name);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      {!unitsRes.ok ? (
        <p className="text-sm text-red-600">{t("listError")}</p>
      ) : units.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">{t("col.label")}</th>
                <th className="px-4 py-3">{t("col.property")}</th>
                <th className="px-4 py-3">{t("col.status")}</th>
                <th className="px-4 py-3 font-mono">{t("col.id")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {units.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{u.label}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {propMap.get(u.propertyId) ?? u.propertyId}
                  </td>
                  <td className="px-4 py-3">{u.status}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{u.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
