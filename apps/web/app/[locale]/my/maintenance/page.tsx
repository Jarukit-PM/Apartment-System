import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Wrench } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, statusVariant } from "@/components/ui/status-badge";
import { apiGetJsonAuthed } from "@/lib/api/server";
import { createMyMaintenanceRequest } from "@/lib/actions/resident";
import type { ListWrapper, MaintenanceRequest, MeSummaryData, SingleWrapper } from "@/lib/api/types";

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
          <PageHeader title={t("maintenanceTitle")} icon={Wrench} />
          <p className="mt-4 text-sm text-[var(--ap-muted)]">{t("forbiddenHint")}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("maintenanceTitle")} icon={Wrench} />
        <p className="ap-alert-error mt-4">{t("loadError")}</p>
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
      <PageHeader title={t("maintenanceTitle")} subtitle={t("maintenanceSubtitle")} icon={Wrench} />

      <SectionCard title={t("newRequestTitle")} icon={Plus}>
        {unitChoices.length === 0 ? (
          <p className="mt-3 ap-alert ap-alert-warning">{t("maintenanceNoUnit")}</p>
        ) : (
          <div className="mt-4">
            <ActionForm
              action={createMyMaintenanceRequest}
              locale={locale}
              submitLabel={t("newRequestSubmit")}
            >
              <div>
                <label htmlFor="my-maint-unit" className="ap-label">
                  {t("unit")}
                </label>
                <select
                  id="my-maint-unit"
                  name="unitId"
                  required
                  className="mt-1 w-full ap-select"
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
                <label htmlFor="my-maint-title" className="ap-label">
                  {t("ticketTitle")}
                </label>
                <input
                  id="my-maint-title"
                  name="title"
                  required
                  className="mt-1 w-full ap-select"
                />
              </div>
              <div>
                <label
                  htmlFor="my-maint-desc"
                  className="ap-label"
                >
                  {t("description")}
                </label>
                <textarea
                  id="my-maint-desc"
                  name="description"
                  rows={3}
                  className="mt-1 w-full ap-select"
                />
              </div>
            </ActionForm>
          </div>
        )}
      </SectionCard>

      <section>
        <h2 className="ap-eyebrow">{t("ticketListTitle")}</h2>
        {tickets.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Wrench} title={t("ticketsEmpty")} />
          </div>
        ) : (
          <ul className="ap-card mt-4 divide-y divide-[var(--ap-border)] overflow-hidden">
            {tickets.map((m) => (
              <li key={m.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[var(--foreground)]">{m.title}</p>
                  <StatusBadge variant={statusVariant(m.status)}>{m.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-[var(--ap-muted)]">{m.description}</p>
                <p className="mt-2 text-xs text-[var(--ap-muted)]">
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
