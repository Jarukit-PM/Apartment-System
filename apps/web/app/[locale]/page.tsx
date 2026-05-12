import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiBaseUrl } from "@/lib/api";
import { LocaleSwitcher } from "@/components/locale-switcher";

type HealthResponse = {
  status: string;
  mongo: string;
};

async function fetchHealth(): Promise<HealthResponse | null> {
  const base = apiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const health = await fetchHealth();

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("brand")}
          </p>
          <LocaleSwitcher label={t("language")} />
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t("heading")}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>

        <dl className="mt-8 space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t("apiBase")}</dt>
            <dd className="truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
              {apiBaseUrl()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t("apiStatus")}</dt>
            <dd className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {health ? health.status : t("unreachable")}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t("mongo")}</dt>
            <dd className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {health ? health.mongo : "—"}
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
