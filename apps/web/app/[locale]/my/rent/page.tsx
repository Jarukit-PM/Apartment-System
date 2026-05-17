import { getTranslations, setRequestLocale } from "next-intl/server";
import { Home } from "lucide-react";
import { RentUnitsBrowse } from "@/components/rent/rent-units-browse";
import { PageHeader } from "@/components/ui/page-header";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { AvailableUnit, ListWrapper } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyRentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal.rentBook");

  const res = await apiGetJsonAuthed<ListWrapper<AvailableUnit>>("/v1/me/available-units");

  if (!res.ok) {
    const detail = res.error?.message?.trim();
    const hint404 =
      res.status === 404
        ? t("loadError404Hint")
        : res.status === 403
          ? t("loadError403Hint")
          : null;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="ap-headline">{t("title")}</h1>
        <p className="ap-alert-error">{t("loadError")}</p>
        {detail ? (
          <p className="text-sm text-[var(--foreground)]" role="status">
            {detail} ({res.status})
          </p>
        ) : (
          <p className="text-sm text-[var(--ap-muted)]" role="status">
            {t("loadErrorStatus", { status: res.status })}
          </p>
        )}
        {hint404 ? <p className="text-sm text-[var(--ap-muted)]">{hint404}</p> : null}
      </div>
    );
  }

  const units = res.data.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={Home} />
      <RentUnitsBrowse units={units} locale={locale} />
    </div>
  );
}
