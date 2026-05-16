import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { MeSummaryData, SingleWrapper } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ProfilePage");

  const res = await apiGetJsonAuthed<SingleWrapper<MeSummaryData>>("/v1/me/summary");

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <p className="text-sm text-red-600 dark:text-red-400">
          {res.status === 403 ? t("forbidden") : t("loadError")}
        </p>
        {res.status === 403 ? (
          <Link href="/dashboard" className="ap-btn ap-btn-secondary inline-flex">
            {t("adminConsole")}
          </Link>
        ) : null}
      </div>
    );
  }

  const me = res.data.data;
  const building = me.property?.name;
  const unitLabel = me.primaryUnit?.label;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("greeting", { name: me.resident.fullName })} />

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("contactSection")}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="ap-label !mb-1">{t("fullName")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{me.resident.fullName}</dd>
          </div>
          <div>
            <dt className="ap-label !mb-1">{t("email")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{me.resident.email}</dd>
          </div>
          {me.resident.phone ? (
            <div>
              <dt className="ap-label !mb-1">{t("phone")}</dt>
              <dd className="font-medium text-[var(--foreground)]">{me.resident.phone}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("homeSection")}</h2>
        <p className="mt-3 text-sm text-[var(--foreground)]">
          {building && unitLabel
            ? t("homeLine", { building, unit: unitLabel })
            : t("homeUnknown")}
        </p>
        {me.activeLease ? (
          <p className="mt-2 text-sm text-[var(--ap-muted)]">
            {t("leaseStatus", { status: me.activeLease.status })}
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{t("noActiveLease")}</p>
        )}
      </section>

      <p className="text-sm">
        <Link href="/my" className="font-medium text-[var(--ap-accent)] hover:underline">
          {t("backToSummary")}
        </Link>
      </p>
    </div>
  );
}
