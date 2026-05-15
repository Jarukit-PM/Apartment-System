import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { EntityImageUpload } from "@/components/entity-image-upload";
import { PropertyImage } from "@/components/entity-image";
import {
  removePropertyImage,
  updateProperty,
  uploadPropertyImage,
} from "@/lib/portal-actions";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { ListWrapper, Property, SingleWrapper, Unit } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export default async function PropertyDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PropertyDetailPage");

  const [propRes, unitsRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<Property>>(`/v1/properties/${id}`),
    apiGetJsonAuthed<ListWrapper<Unit>>(`/v1/units?propertyId=${encodeURIComponent(id)}`),
  ]);

  if (!propRes.ok) {
    if (propRes.status === 404) {
      notFound();
    }
    const tAuth = await getTranslations("Auth");
    const loginHref = `/login?next=${encodeURIComponent(`/properties/${id}`)}`;
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <Link href="/properties" className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <h1 className="ap-headline">{t("fetchErrorTitle")}</h1>
        <p className="ap-body text-sm">{propRes.error?.message ?? t("fetchErrorBody")}</p>
        {propRes.status === 401 || propRes.status === 403 ? (
          <p className="text-sm">
            <Link href={loginHref} className="font-medium text-[var(--ap-gold-deep)] hover:underline">
              {tAuth("signIn")}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  const property = propRes.data.data;
  const unitCount = unitsRes.ok ? unitsRes.data.data.length : null;
  const addr = property.address;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/properties" className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <PageHeader title={t("editTitle")} subtitle={t("editSubtitle")} />
      </div>

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("imageSection")}</h2>
        <PropertyImage name={property.name} imageUrl={property.imageUrl} className="mt-4 max-w-md" />
        <div className="mt-4 max-w-md">
          <EntityImageUpload
            action={uploadPropertyImage}
            locale={locale}
            entityId={id}
            entityField="propertyId"
            hasImage={Boolean(property.imageUrl)}
            removeAction={removePropertyImage}
            labels={{
              file: t("imageFile"),
              submit: t("imageUpload"),
              remove: t("imageRemove"),
              hint: t("imageHint"),
            }}
          />
        </div>
      </section>

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("detailsSection")}</h2>
        <div className="mt-4">
        <ActionForm action={updateProperty} locale={locale} submitLabel={t("saveProperty")}>
          <input type="hidden" name="id" value={id} />
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="ap-label">
                {t("nameLabel")}
              </label>
              <input id="name" name="name" required defaultValue={property.name} className="ap-input" />
            </div>
            <p className="font-mono text-xs text-[var(--ap-muted)]">{property.id}</p>

            <div className="border-t border-[var(--ap-border)] pt-5">
              <h3 className="text-sm font-medium text-[var(--foreground)]">{t("addressSection")}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="addressLine1" className="ap-label">
                    {t("addressLine1")}
                  </label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    defaultValue={addr?.line1 ?? ""}
                    className="ap-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="addressLine2" className="ap-label">
                    {t("addressLine2")}
                  </label>
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    defaultValue={addr?.line2 ?? ""}
                    className="ap-input"
                  />
                </div>
                <div>
                  <label htmlFor="addressCity" className="ap-label">
                    {t("addressCity")}
                  </label>
                  <input
                    id="addressCity"
                    name="addressCity"
                    defaultValue={addr?.city ?? ""}
                    className="ap-input"
                  />
                </div>
                <div>
                  <label htmlFor="addressRegion" className="ap-label">
                    {t("addressRegion")}
                  </label>
                  <input
                    id="addressRegion"
                    name="addressRegion"
                    defaultValue={addr?.region ?? ""}
                    className="ap-input"
                  />
                </div>
                <div>
                  <label htmlFor="addressPostalCode" className="ap-label">
                    {t("addressPostalCode")}
                  </label>
                  <input
                    id="addressPostalCode"
                    name="addressPostalCode"
                    defaultValue={addr?.postalCode ?? ""}
                    className="ap-input"
                  />
                </div>
                <div>
                  <label htmlFor="addressCountry" className="ap-label">
                    {t("addressCountry")}
                  </label>
                  <input
                    id="addressCountry"
                    name="addressCountry"
                    defaultValue={addr?.country ?? ""}
                    className="ap-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </ActionForm>
        </div>
      </section>

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("unitsSection")}</h2>
        <p className="mt-2 text-sm text-[var(--ap-muted)]">
          {unitCount === null
            ? t("unitsCountUnknown")
            : t("unitsCount", { count: unitCount })}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/units?propertyId=${encodeURIComponent(id)}`}
            className="ap-btn ap-btn-secondary inline-flex"
          >
            {t("manageUnitsLink")}
          </Link>
          <Link
            href={`/units/new?propertyId=${encodeURIComponent(id)}`}
            className="ap-btn ap-btn-primary inline-flex"
          >
            {t("addUnitLink")}
          </Link>
        </div>
      </section>
    </div>
  );
}
