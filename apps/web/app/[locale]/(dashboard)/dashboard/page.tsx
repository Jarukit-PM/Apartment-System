import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiBaseUrl } from "@/lib/api";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type {
  HealthResponse,
  Lease,
  ListWrapper,
  MaintenanceRequest,
  Property,
  Resident,
  Unit,
} from "@/lib/types";

async function fetchHealth(): Promise<HealthResponse | null> {
  const base = apiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DashboardPage");

  const [health, props, units, residents, leases, maint] = await Promise.all([
    fetchHealth(),
    apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties"),
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Resident>>("/v1/residents"),
    apiGetJsonAuthed<ListWrapper<Lease>>("/v1/leases"),
    apiGetJsonAuthed<ListWrapper<MaintenanceRequest>>("/v1/maintenance-requests"),
  ]);

  const stat = (label: string, n: number, ok: boolean) => (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {ok ? n : "—"}
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          {t("statsHeading")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stat(t("stats.properties"), props.ok ? props.data.data.length : 0, props.ok)}
          {stat(t("stats.units"), units.ok ? units.data.data.length : 0, units.ok)}
          {stat(t("stats.residents"), residents.ok ? residents.data.data.length : 0, residents.ok)}
          {stat(t("stats.leases"), leases.ok ? leases.data.data.length : 0, leases.ok)}
          {stat(t("stats.maintenance"), maint.ok ? maint.data.data.length : 0, maint.ok)}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("stats.api")}</p>
            <p className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-50">
              {health ? `${health.status} · ${health.mongo}` : t("stats.apiDown")}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("quick.title")}</h2>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              href="/properties"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {t("quick.properties")}
            </Link>
          </li>
          <li>
            <Link href="/leases" className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600">
              {t("quick.leases")}
            </Link>
          </li>
          <li>
            <Link href="/maintenance" className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600">
              {t("quick.maintenance")}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
