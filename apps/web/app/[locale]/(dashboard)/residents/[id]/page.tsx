import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import { ResidentOccupancyCalendar } from "@/components/resident-occupancy-calendar";
import {
  currentActiveStay,
  leasesToResidentStays,
  unitDisplayMap,
} from "@/lib/resident-occupancy";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { Lease, ListWrapper, Property, Resident, SingleWrapper, Unit } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export default async function ResidentDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ResidentDetailPage");

  const [residentRes, leasesRes, unitsRes, propsRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<Resident>>(`/v1/residents/${id}`),
    apiGetJsonAuthed<ListWrapper<Lease>>(`/v1/leases?residentId=${encodeURIComponent(id)}`),
    apiGetJsonAuthed<ListWrapper<Unit>>("/v1/units"),
    apiGetJsonAuthed<ListWrapper<Property>>("/v1/properties"),
  ]);

  if (!residentRes.ok) {
    if (residentRes.status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <Link href="/residents" className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <h1 className="ap-headline">{t("fetchErrorTitle")}</h1>
        <p className="ap-body text-sm">{residentRes.error?.message ?? t("fetchErrorBody")}</p>
      </div>
    );
  }

  const resident = residentRes.data.data;
  const units = unitsRes.ok ? unitsRes.data.data : [];
  const properties = propsRes.ok ? propsRes.data.data : [];
  const unitMap = unitDisplayMap(units, properties);
  const stays = leasesRes.ok ? leasesToResidentStays(leasesRes.data.data, unitMap) : [];
  const active = currentActiveStay(stays);

  const weekdays =
    locale === "th"
      ? [
          t("weekMon"),
          t("weekTue"),
          t("weekWed"),
          t("weekThu"),
          t("weekFri"),
          t("weekSat"),
          t("weekSun"),
        ]
      : [
          t("weekSun"),
          t("weekMon"),
          t("weekTue"),
          t("weekWed"),
          t("weekThu"),
          t("weekFri"),
          t("weekSat"),
        ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/residents" className="text-sm text-[var(--ap-gold-deep)] hover:underline">
          ← {t("back")}
        </Link>
        <PageHeader title={resident.fullName} subtitle={resident.email} />
        {resident.phone ? (
          <p className="mt-1 text-sm text-[var(--ap-muted)]">{resident.phone}</p>
        ) : null}
        <p className="mt-1 font-mono text-xs text-[var(--ap-muted)]">{resident.id}</p>
      </div>

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("currentStayTitle")}</h2>
        {active ? (
          <div className="mt-3">
            <p className="text-sm text-[var(--foreground)]">
              <Link
                href={`/units/${active.unitId}`}
                className="font-medium text-[var(--ap-gold-deep)] hover:underline"
              >
                {active.unitLabel}
                {active.propertyName ? ` · ${active.propertyName}` : ""}
              </Link>
            </p>
            <p className="mt-1 text-xs text-[var(--ap-muted)]">{t("statusActive")}</p>
          </div>
        ) : resident.primaryUnitId && unitMap.has(resident.primaryUnitId) ? (
          <p className="mt-3 text-sm text-[var(--ap-muted)]">
            {t("primaryUnitOnly")}{" "}
            <Link
              href={`/units/${resident.primaryUnitId}`}
              className="font-medium text-[var(--ap-gold-deep)] hover:underline"
            >
              {unitMap.get(resident.primaryUnitId)!.label}
            </Link>
          </p>
        ) : (
          <p className="mt-3 text-sm text-[var(--ap-muted)]">{t("noCurrentStay")}</p>
        )}
      </section>

      <section className="ap-card p-6 md:p-8">
        {!leasesRes.ok ? (
          <p className="text-sm text-red-600">{t("calendarLoadError")}</p>
        ) : stays.length === 0 ? (
          <div>
            <h2 className="ap-eyebrow">{t("calendarTitle")}</h2>
            <p className="mt-3 text-sm text-[var(--ap-muted)]">{t("calendarEmpty")}</p>
          </div>
        ) : (
          <ResidentOccupancyCalendar
            locale={locale}
            stays={stays}
            labels={{
              title: t("calendarTitle"),
              subtitle: t("calendarSubtitle"),
              prevMonth: t("prevMonth"),
              nextMonth: t("nextMonth"),
              noStay: t("noStay"),
              openEnded: t("openEnded"),
              leaseListTitle: t("leaseListTitle"),
              statusActive: t("statusActive"),
              statusEnded: t("statusEnded"),
              statusDraft: t("statusDraft"),
              weekdays,
            }}
          />
        )}
      </section>
    </div>
  );
}
