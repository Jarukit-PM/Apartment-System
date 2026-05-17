import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Wrench } from "lucide-react";
import { MaintenanceRequestForm } from "@/components/maintenance/maintenance-request-form";
import { MaintenanceTicketImages } from "@/components/maintenance/maintenance-ticket-images";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, statusVariant } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { createMaintenance, updateMaintenanceStatus } from "@/lib/actions/portal";
import { maintenanceCategoryOptions } from "@/lib/maintenance/category-labels";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { ListWrapper, MaintenanceRequest, Resident, Unit } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MaintenancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MaintenancePage");
  const tCat = await getTranslations("MaintenanceCategories");
  const tf = await getTranslations("FormFeedback");

  const [listRes, unitsRes, resRes] = await Promise.all([
    apiGetJsonAuthed<ListWrapper<MaintenanceRequest>>("/v1/maintenance-requests"),
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Resident>>("/v1/residents"),
  ]);

  const items = listRes.ok ? listRes.data.data : [];
  const units = unitsRes.ok ? unitsRes.data.data : [];
  const residents = resRes.ok ? resRes.data.data : [];
  const categories = maintenanceCategoryOptions((key) => tCat(key));

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader title={t("title")} icon={Wrench} />

      <SectionCard title={t("addTitle")} icon={Plus}>
        <div className="max-w-lg">
          <MaintenanceRequestForm
            action={createMaintenance}
            locale={locale}
            submitLabel={t("addSubmit")}
            categories={categories}
            unitChoices={units.map((u) => ({ unitId: u.id, label: u.label }))}
            residents={residents.map((r) => ({ id: r.id, fullName: r.fullName }))}
            requireUnitPick
            showStatus
            success={{
              title: tf("submittedTitle"),
              description: tf("submittedDescription"),
              closeLabel: tf("close"),
            }}
            labels={{
              unit: t("unit"),
              pickUnit: t("pickUnit"),
              ticketTitle: t("ticketTitle"),
              titleOther: t("titleOther"),
              titleOtherPlaceholder: t("titleOtherPlaceholder"),
              description: t("description"),
              photos: t("photos"),
              photosHint: t("photosHint"),
              requestedBy: t("requestedBy"),
              optional: t("optional"),
              status: t("status"),
            }}
          />
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
                    <MaintenanceTicketImages imageUrls={m.imageUrls} alt={t("photoAlt")} />
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

