import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { PropertyImage } from "@/components/entities/entity-image";
import { createProperty, deleteProperty } from "@/lib/actions/portal";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { ListWrapper, Property } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function PropertiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PropertiesPage");

  const res = await apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties");
  const list = res.ok ? res.data.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader title={t("title")} icon={Building2} />

      <SectionCard title={t("addTitle")} icon={Plus}>
        <div className="mt-4 max-w-md">
          <ActionForm action={createProperty} locale={locale} submitLabel={t("addSubmit")}>
            <div>
              <label htmlFor="name" className="ap-label">
                {t("nameLabel")}
              </label>
              <input id="name" name="name" required className="ap-input" />
            </div>
          </ActionForm>
        </div>
      </SectionCard>

      <section>
        <h2 className="ap-eyebrow">{t("listTitle")}</h2>
        {!res.ok ? (
          <p className="ap-alert-error mt-4">{t("listError")}</p>
        ) : list.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Building2} title={t("empty")} />
          </div>
        ) : (
          <ul className="ap-card mt-4 divide-y divide-[var(--ap-border)] overflow-hidden">
            {list.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Link href={`/properties/${p.id}`} className="shrink-0">
                    <PropertyImage name={p.name} imageUrl={p.imageUrl} className="w-20" aspect="square" />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/properties/${p.id}`}
                      className="font-medium text-[var(--foreground)] hover:text-[var(--ap-accent)]"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-[var(--ap-muted)]">{p.id}</p>
                  </div>
                </div>
                <form action={deleteProperty} className="flex items-center gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={p.id} />
                  <SubmitButton label={t("delete")} variant="danger" />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
