import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { PropertyImage } from "@/components/entity-image";
import { createProperty, deleteProperty } from "@/lib/portal-actions";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, Property } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function PropertiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PropertiesPage");

  const res = await apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties");
  const list = res.ok ? res.data.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section className="ap-card p-6 md:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{t("addTitle")}</h2>
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
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{t("listTitle")}</h2>
        {!res.ok ? (
          <p className="mt-4 text-sm text-red-600">{t("listError")}</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ap-muted)]">{t("empty")}</p>
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
