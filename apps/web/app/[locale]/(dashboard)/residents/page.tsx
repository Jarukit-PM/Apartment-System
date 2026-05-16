import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { createResident } from "@/lib/actions/portal";
import { unitDisplayMap } from "@/lib/domain/resident-occupancy";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { ListWrapper, Property, Resident, Unit } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function ResidentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ResidentsPage");

  const [resRes, unitsRes, propsRes] = await Promise.all([
    apiGetJsonAuthed<ListWrapper<Resident>>("/v1/residents"),
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties"),
  ]);

  const list = resRes.ok ? resRes.data.data : [];
  const unitMap =
    unitsRes.ok && propsRes.ok
      ? unitDisplayMap(unitsRes.data.data, propsRes.data.data)
      : new Map<string, { label: string; propertyName?: string }>();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={Users} />

      <SectionCard title={t("addTitle")} icon={Plus} eyebrow>
        <div className="mt-4 max-w-lg">
          <ActionForm action={createResident} locale={locale} submitLabel={t("addSubmit")}>
            <div>
              <label htmlFor="fullName" className="ap-label">
                {t("fullName")}
              </label>
              <input id="fullName" name="fullName" required className="ap-input" />
            </div>
            <div>
              <label htmlFor="email" className="ap-label">
                {t("email")}
              </label>
              <input id="email" name="email" type="email" required className="ap-input" />
            </div>
            <div>
              <label htmlFor="phone" className="ap-label">
                {t("phone")}
              </label>
              <input id="phone" name="phone" className="ap-input" />
            </div>
            <div>
              <label htmlFor="primaryUnitId" className="ap-label">
                {t("primaryUnit")}
              </label>
              <input
                id="primaryUnitId"
                name="primaryUnitId"
                placeholder={t("primaryUnitPh")}
                className="ap-input font-mono text-sm"
              />
            </div>
          </ActionForm>
        </div>
      </SectionCard>

      <section>
        <h2 className="ap-eyebrow">{t("listTitle")}</h2>
        {!resRes.ok ? (
          <p className="ap-alert-error mt-4">{t("listError")}</p>
        ) : list.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Users} title={t("empty")} />
          </div>
        ) : (
          <ul className="ap-card mt-4 divide-y divide-[var(--ap-border)] overflow-hidden">
            {list.map((r) => {
              const primary = r.primaryUnitId ? unitMap.get(r.primaryUnitId) : undefined;
              return (
                <li key={r.id}>
                  <Link
                    href={`/residents/${r.id}`}
                    className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-[#faf8f5] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="font-medium text-[var(--foreground)]">{r.fullName}</span>
                      <p className="text-sm text-[var(--ap-muted)]">{r.email}</p>
                    </div>
                    <p className="text-sm text-[var(--ap-muted)] sm:text-right">
                      {primary
                        ? `${primary.label}${primary.propertyName ? ` · ${primary.propertyName}` : ""}`
                        : t("noPrimaryUnit")}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
