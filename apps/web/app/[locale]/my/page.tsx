import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { MeSummaryData, SingleWrapper } from "@/lib/types";

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
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("summaryTitle")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("forbiddenHint")}</p>
        </div>
      );
    }
    if (res.status === 404) {
      return (
        <div className="mx-auto max-w-xl space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("summaryTitle")}</h1>
          <p className="text-sm text-red-600 dark:text-red-400">{t("loadError404Resident")}</p>
          {res.error?.message ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
              {res.error.message}
            </p>
          ) : null}
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("summaryTitle")}</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
      </div>
    );
  }

  const me = res.data.data;
  const building = me.property?.name;
  const unitLabel = me.primaryUnit?.label;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("summaryTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {t("greeting", { name: me.resident.fullName })}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("profileSection")}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("email")}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">{me.resident.email}</dd>
          </div>
          {me.resident.phone ? (
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">{t("phone")}</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{me.resident.phone}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("homeSection")}
        </h2>
        <p className="mt-3 text-sm text-zinc-800 dark:text-zinc-100">
          {building && unitLabel
            ? t("homeLine", { building, unit: unitLabel })
            : t("homeUnknown")}
        </p>
        {me.activeLease ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("leaseStatus", { status: me.activeLease.status })}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-amber-800 dark:text-amber-200">{t("noActiveLease")}</p>
            <p className="text-sm">
              <Link href="/my/rent" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                {t("summaryRentLink")}
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
