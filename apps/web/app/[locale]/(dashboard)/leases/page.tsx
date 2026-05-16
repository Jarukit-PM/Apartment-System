import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { createLease, updateLeaseStatus } from "@/lib/actions/portal";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { Lease, ListWrapper, Resident, Unit } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function LeasesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("LeasesPage");

  const [leasesRes, unitsRes, resRes] = await Promise.all([
    apiGetJsonAuthed<ListWrapper<Lease>>("/v1/leases"),
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Resident>>("/v1/residents"),
  ]);

  const leases = leasesRes.ok ? leasesRes.data.data : [];
  const units = unitsRes.ok ? unitsRes.data.data : [];
  const residents = resRes.ok ? resRes.data.data : [];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("addTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("addHint")}</p>
        <div className="mt-4 max-w-2xl">
          <ActionForm action={createLease} locale={locale} submitLabel={t("addSubmit")}>
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
                    {u.label} ({u.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="residentIds" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("residents")}
              </label>
              <input
                id="residentIds"
                name="residentIds"
                required
                placeholder={t("residentsPh")}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
              <p className="mt-1 text-xs text-zinc-500">{t("residentsHelp")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("start")}
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("end")}
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("status")}
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="ended">ended</option>
                </select>
              </div>
              <div>
                <label htmlFor="rentAmount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("rentAmount")}
                </label>
                <input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label htmlFor="rentCurrency" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("currency")}
                </label>
                <input
                  id="rentCurrency"
                  name="rentCurrency"
                  defaultValue="THB"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
            </div>
          </ActionForm>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("listTitle")}</h2>
        {!leasesRes.ok ? (
          <p className="mt-4 text-sm text-red-600">{t("listError")}</p>
        ) : leases.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {leases.map((lease) => (
              <li
                key={lease.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {t("leaseLine", { status: lease.status })}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{lease.id}</p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {t("unitId")}: <span className="font-mono">{lease.unitId}</span>
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t("rent")}: {lease.rent.amount} {lease.rent.currency}
                    </p>
                  </div>
                  <form action={updateLeaseStatus} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={lease.id} />
                    <div>
                      <label className="sr-only" htmlFor={`st-${lease.id}`}>
                        {t("status")}
                      </label>
                      <select
                        id={`st-${lease.id}`}
                        name="status"
                        defaultValue={lease.status}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      >
                        <option value="draft">draft</option>
                        <option value="active">active</option>
                        <option value="ended">ended</option>
                      </select>
                    </div>
                    <SubmitButton label={t("saveStatus")} variant="ghost" />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {residents.length > 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-600">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">{t("residentRef")}</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {residents.map((r) => (
              <li key={r.id}>
                {r.id} — {r.fullName}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
