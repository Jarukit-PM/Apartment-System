import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { createMaintenance, updateMaintenanceStatus } from "@/lib/portal-actions";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, MaintenanceRequest, Resident, Unit } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MaintenancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MaintenancePage");

  const [listRes, unitsRes, resRes] = await Promise.all([
    apiGetJsonAuthed<ListWrapper<MaintenanceRequest>>("/v1/maintenance-requests"),
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Resident>>("/v1/residents"),
  ]);

  const items = listRes.ok ? listRes.data.data : [];
  const units = unitsRes.ok ? unitsRes.data.data : [];
  const residents = resRes.ok ? resRes.data.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("addTitle")}</h2>
        <div className="mt-4 max-w-lg">
          <ActionForm action={createMaintenance} locale={locale} submitLabel={t("addSubmit")}>
            <div>
              <label htmlFor="unitId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("unit")}
              </label>
              <select
                id="unitId"
                name="unitId"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">{t("pickUnit")}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("ticketTitle")}
              </label>
              <input
                id="title"
                name="title"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("description")}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="requestedByResidentId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("requestedBy")}
              </label>
              <select
                id="requestedByResidentId"
                name="requestedByResidentId"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">{t("optional")}</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("status")}
              </label>
              <select
                id="status"
                name="status"
                defaultValue="open"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="closed">closed</option>
              </select>
            </div>
          </ActionForm>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("listTitle")}</h2>
        {!listRes.ok ? (
          <p className="mt-4 text-sm text-red-600">{t("listError")}</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{m.title}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.description}</p>
                    <p className="mt-2 font-mono text-xs text-zinc-500">{m.id}</p>
                  </div>
                  <form action={updateMaintenanceStatus} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={m.id} />
                    <select
                      name="status"
                      defaultValue={m.status}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    >
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="closed">closed</option>
                    </select>
                    <SubmitButton label={t("saveStatus")} variant="ghost" />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
