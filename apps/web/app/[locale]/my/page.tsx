import { getTranslations, setRequestLocale } from "next-intl/server";
import { Home, LayoutDashboard, Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { MeSummaryData, SingleWrapper } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MySummaryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal");

  const res = await apiGetJsonAuthed<SingleWrapper<MeSummaryData>>("/v1/me/summary");

  if (!res.ok) {
    if (res.status === 403) {
      return (
        <div className="mx-auto max-w-xl space-y-4">
          <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />
        </div>
      );
    }
    if (res.status === 404) {
      return (
        <div className="mx-auto max-w-xl space-y-4">
          <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />
          <p className="ap-alert-error">{t("loadError404Resident")}</p>
          {res.error?.message ? (
            <p className="text-xs text-[var(--ap-muted)]" role="status">
              {res.error.message}
            </p>
          ) : null}
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />
        <p className="ap-alert-error">{t("loadError")}</p>
      </div>
    );
  }

  const me = res.data.data;
  const building = me.property?.name;
  const unitLabel = me.primaryUnit?.label;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />

      <SectionCard title={t("profileSection")} icon={Mail} eyebrow>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="ap-label">{t("email")}</dt>
            <dd className="flex items-center gap-2 font-medium text-[var(--foreground)]">
              <Mail className="h-4 w-4 text-[var(--ap-gold-deep)]" strokeWidth={1.75} aria-hidden />
              {me.resident.email}
            </dd>
          </div>
          {me.resident.phone ? (
            <div>
              <dt className="ap-label">{t("phone")}</dt>
              <dd className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <Phone className="h-4 w-4 text-[var(--ap-gold-deep)]" strokeWidth={1.75} aria-hidden />
                {me.resident.phone}
              </dd>
            </div>
          ) : null}
        </dl>
      </SectionCard>

      <SectionCard title={t("homeSection")} icon={Home} eyebrow>
        <p className="text-sm text-[var(--foreground)]">
          {building && unitLabel
            ? t("homeLine", { building, unit: unitLabel })
            : t("homeUnknown")}
        </p>
        {me.activeLease ? (
          <p className="mt-2 text-sm text-[var(--ap-muted)]">
            {t("leaseStatus", { status: me.activeLease.status })}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="ap-alert ap-alert-warning">{t("noActiveLease")}</p>
            <p className="text-sm">
              <Link href="/my/rent" className="font-medium text-[var(--ap-gold-deep)] hover:underline">
                {t("summaryRentLink")}
              </Link>
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
