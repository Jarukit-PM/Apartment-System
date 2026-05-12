import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionForm } from "@/components/action-form";
import { apiGetJsonAuthed } from "@/lib/server-api";
import { createMyMaintenanceRequest } from "@/lib/resident-actions";
import type { ListWrapper, MaintenanceRequest, MeSummaryData, SingleWrapper } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyMaintenancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal");

  const [summaryRes, listRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<MeSummaryData>>("/v1/me/summary"),
    apiGetJsonAuthed<ListWrapper<MaintenanceRequest>>("/v1/me/maintenance-requests"),
  ]);

  if (!summaryRes.ok || !listRes.ok) {
    if (summaryRes.status === 403 || listRes.status === 403) {
      return (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("maintenanceTitle")}</h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("forbiddenHint")}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("maintenanceTitle")}</h1>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
      </div>
    );
  }

  const summary = summaryRes.data.data;
  const leases = summary.leases;
  const primary = summary.primaryUnit;
  const unitChoices = leases
    .filter((l) => l.status === "active")
    .map((l) => ({
      unitId: l.unitId,
      label: primary && primary.id === l.unitId ? primary.label : l.unitId,
    }));

  const tickets = listRes.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("maintenanceTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("maintenanceSubtitle")}</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("newRequestTitle")}</h2>
        {unitChoices.length === 0 ? (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{t("maintenanceNoUnit")}</p>
        ) : (
          <div className="mt-4">
            <ActionForm
              action={createMyMaintenanceRequest}
              locale={locale}
              submitLabel={t("newRequestSubmit")}
            >
              <div>
                <label htmlFor="my-maint-unit" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {t("unit")}
                </label>
                <select
                  id="my-maint-unit"
                  name="unitId"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  defaultValue={unitChoices[0]?.unitId}
                >
                  {unitChoices.map((u) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="my-maint-title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {t("ticketTitle")}
                </label>
                <input
                  id="my-maint-title"
                  name="title"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label
                  htmlFor="my-maint-desc"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-200"
                >
                  {t("description")}
                </label>
                <textarea
                  id="my-maint-desc"
                  name="description"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
              </div>
            </ActionForm>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("ticketListTitle")}</h2>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{t("ticketsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tickets.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{m.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.description}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("ticketMeta", { status: m.status, id: m.id.slice(-8) })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
