import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClipboardList, Plus } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, statusVariant } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { createLease, updateLeaseStatus } from "@/lib/actions/portal";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { Lease, ListWrapper, Resident, Unit } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function LeasesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("LeasesPage");
  const tf = await getTranslations("FormFeedback");

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
      <PageHeader title={t("title")} icon={ClipboardList} />

      <SectionCard title={t("addTitle")} description={t("addHint")} icon={Plus}>
        <div className="max-w-2xl">
          <ActionForm
            action={createLease}
            locale={locale}
            submitLabel={t("addSubmit")}
            success={{
              title: tf("createdTitle"),
              description: tf("createdDescription"),
              closeLabel: tf("close"),
            }}
          >
            <div>
              <label htmlFor="unitId" className="ap-label">
                {t("unit")}
              </label>
              <select id="unitId" name="unitId" required className="ap-select">
                <option value="">{t("pickUnit")}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label} ({u.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="residentIds" className="ap-label">
                {t("residents")}
              </label>
              <input
                id="residentIds"
                name="residentIds"
                required
                placeholder={t("residentsPh")}
                className="ap-input font-mono text-sm"
              />
              <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("residentsHelp")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="ap-label">
                  {t("start")}
                </label>
                <input id="startDate" name="startDate" type="datetime-local" required className="ap-input" />
              </div>
              <div>
                <label htmlFor="endDate" className="ap-label">
                  {t("end")}
                </label>
                <input id="endDate" name="endDate" type="datetime-local" className="ap-input" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="status" className="ap-label">
                  {t("status")}
                </label>
                <select id="status" name="status" defaultValue="draft" className="ap-select">
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="ended">ended</option>
                </select>
              </div>
              <div>
                <label htmlFor="rentAmount" className="ap-label">
                  {t("rentAmount")}
                </label>
                <input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                  className="ap-input"
                />
              </div>
              <div>
                <label htmlFor="rentCurrency" className="ap-label">
                  {t("currency")}
                </label>
                <input id="rentCurrency" name="rentCurrency" defaultValue="THB" className="ap-input" />
              </div>
            </div>
          </ActionForm>
        </div>
      </SectionCard>

      <section>
        <h2 className="ap-eyebrow">{t("listTitle")}</h2>
        {!leasesRes.ok ? (
          <p className="ap-alert-error mt-4">{t("listError")}</p>
        ) : leases.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={ClipboardList} title={t("empty")} />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {leases.map((lease) => (
              <li key={lease.id} className="ap-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--foreground)]">
                        {t("leaseLine", { status: lease.status })}
                      </p>
                      <StatusBadge variant={statusVariant(lease.status)}>{lease.status}</StatusBadge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[var(--ap-muted)]">{lease.id}</p>
                    <p className="mt-2 text-sm text-[var(--ap-muted)]">
                      {t("unitId")}: <span className="font-mono">{lease.unitId}</span>
                    </p>
                    <p className="text-sm text-[var(--ap-muted)]">
                      {t("rent")}: {lease.rent.amount} {lease.rent.currency}
                    </p>
                  </div>
                  <form action={updateLeaseStatus} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={lease.id} />
                    <select
                      id={`st-${lease.id}`}
                      name="status"
                      defaultValue={lease.status}
                      className="ap-select !w-auto min-w-[9rem]"
                      aria-label={t("status")}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="ended">ended</option>
                    </select>
                    <SubmitButton label={t("saveStatus")} variant="ghost" />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {residents.length > 0 ? (
        <section className="ap-card border-dashed p-5">
          <p className="ap-eyebrow">{t("residentRef")}</p>
          <ul className="mt-3 space-y-1 font-mono text-xs text-[var(--ap-muted)]">
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
