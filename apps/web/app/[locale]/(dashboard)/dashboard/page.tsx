import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, ClipboardList, LayoutDashboard, Wrench } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DashboardStats, type StatItem } from "@/components/dashboard/dashboard-stats";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { apiBaseUrl } from "@/lib/api/base";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type {
  HealthResponse,
  Lease,
  ListWrapper,
  MaintenanceRequest,
  Property,
  Resident,
  Unit,
} from "@/lib/api/types";

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

  const stats: StatItem[] = [
    {
      id: "properties",
      label: t("stats.properties"),
      value: props.ok ? String(props.data.data.length) : "—",
      iconKey: "properties",
    },
    {
      id: "units",
      label: t("stats.units"),
      value: units.ok ? String(units.data.data.length) : "—",
      iconKey: "units",
    },
    {
      id: "residents",
      label: t("stats.residents"),
      value: residents.ok ? String(residents.data.data.length) : "—",
      iconKey: "residents",
    },
    {
      id: "leases",
      label: t("stats.leases"),
      value: leases.ok ? String(leases.data.data.length) : "—",
      iconKey: "leases",
    },
    {
      id: "maintenance",
      label: t("stats.maintenance"),
      value: maint.ok ? String(maint.data.data.length) : "—",
      iconKey: "maintenance",
    },
    {
      id: "api",
      label: t("stats.api"),
      value: health ? `${health.status} · ${health.mongo}` : t("stats.apiDown"),
      iconKey: "api",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={LayoutDashboard} />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          {t("statsHeading")}
        </h2>
        <DashboardStats items={stats} />
      </section>

      <SectionCard title={t("quick.title")} icon={Building2}>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link href="/properties" className="ap-btn ap-btn-primary">
              <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {t("quick.properties")}
            </Link>
          </li>
          <li>
            <Link href="/leases" className="ap-btn ap-btn-secondary">
              <ClipboardList className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {t("quick.leases")}
            </Link>
          </li>
          <li>
            <Link href="/maintenance" className="ap-btn ap-btn-secondary">
              <Wrench className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {t("quick.maintenance")}
            </Link>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
