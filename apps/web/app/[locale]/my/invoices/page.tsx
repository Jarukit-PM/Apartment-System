import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { Invoice, ListWrapper } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyInvoicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal");

  const res = await apiGetJsonAuthed<ListWrapper<Invoice>>("/v1/me/invoices");

  if (!res.ok) {
    if (res.status === 403) {
      return (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("invoicesTitle")}</h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("forbiddenHint")}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("invoicesTitle")}</h1>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
      </div>
    );
  }

  const rows = res.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("invoicesTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("invoicesSubtitle")}</p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {t("invoicesEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">{t("colDescription")}</th>
                <th className="px-4 py-3 font-medium">{t("colAmount")}</th>
                <th className="px-4 py-3 font-medium">{t("colDue")}</th>
                <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{inv.description}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                    {inv.amount} {inv.currency}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {inv.dueDate.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
