import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Wrench } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, statusVariant } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { createMaintenance, updateMaintenanceStatus } from "@/lib/actions/portal";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { ListWrapper, MaintenanceRequest, Resident, Unit } from "@/lib/api/types";

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
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={Wrench} />

      <SectionCard title={t("addTitle")} icon={Plus}>
        <div className="max-w-lg">
          <ActionForm action={createMaintenance} locale={locale} submitLabel={t("addSubmit")}>
            <div>
              <label htmlFor="unitId" className="ap-label">
                {t("unit")}
              </label>
              <select id="unitId" name="unitId" required className="ap-select">
                <option value="">{t("pickUnit")}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="ap-label">
                {t("ticketTitle")}
              </label>
              <input id="title" name="title" required className="ap-input" />
            </div>
            <div>
              <label htmlFor="description" className="ap-label">
                {t("description")}
              </label>
              <textarea id="description" name="description" rows={3} className="ap-textarea" />
            </div>
            <div>
              <label htmlFor="requestedByResidentId" className="ap-label">
                {t("requestedBy")}
              </label>
              <select id="requestedByResidentId" name="requestedByResidentId" className="ap-select">
                <option value="">{t("optional")}</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="ap-label">
                {t("status")}
              </label>
              <select id="status" name="status" defaultValue="open" className="ap-select">
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="closed">closed</option>
              </select>
            </div>
          </ActionForm>
        </div>
      </SectionCard>

      <section>
        <h2 className="ap-eyebrow">{t("listTitle")}</h2>
        {!listRes.ok ? (
          <p className="ap-alert-error mt-4">{t("listError")}</p>
        ) : items.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Wrench} title={t("empty")} />
          </div>
        ) : (
          <ul className="ap-card mt-4 divide-y divide-[var(--ap-border)] overflow-hidden">
            {items.map((m) => (
              <li key={m.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--foreground)]">{m.title}</p>
                      <StatusBadge variant={statusVariant(m.status)}>{m.status}</StatusBadge>
                    </div>
                    {m.description ? (
                      <p className="mt-1 text-sm text-[var(--ap-muted)]">{m.description}</p>
                    ) : null}
                    <p className="mt-2 font-mono text-xs text-[var(--ap-muted)]">{m.id}</p>
                  </div>
                  <form action={updateMaintenanceStatus} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={m.id} />
                    <select name="status" defaultValue={m.status} className="ap-select !w-auto min-w-[9rem]">
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
