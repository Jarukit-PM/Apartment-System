import type { Lease, Property, Unit } from "@/lib/api/types";
import { utcDayMs } from "@/lib/domain/unit-occupancy";

export { utcDayMs };

export type ResidentStay = {
  id: string;
  startDate: string;
  endDate?: string;
  status: string;
  unitId: string;
  unitLabel: string;
  propertyName?: string;
};

export function unitDisplayMap(
  units: Unit[],
  properties: Property[],
): Map<string, { label: string; propertyName?: string }> {
  const propNames = new Map(properties.map((p) => [p.id, p.name]));
  const m = new Map<string, { label: string; propertyName?: string }>();
  for (const u of units) {
    m.set(u.id, { label: u.label, propertyName: propNames.get(u.propertyId) });
  }
  return m;
}

export function leasesToResidentStays(
  leases: Lease[],
  units: Map<string, { label: string; propertyName?: string }>,
): ResidentStay[] {
  return leases.map((lease) => {
    const u = units.get(lease.unitId);
    return {
      id: lease.id,
      startDate: lease.startDate,
      endDate: lease.endDate,
      status: lease.status,
      unitId: lease.unitId,
      unitLabel: u?.label ?? lease.unitId.slice(-6),
      propertyName: u?.propertyName,
    };
  });
}

export function stayCoversDay(stay: ResidentStay, dayMs: number): boolean {
  const start = utcDayMs(stay.startDate);
  if (dayMs < start) return false;
  if (stay.endDate) {
    return dayMs <= utcDayMs(stay.endDate);
  }
  return true;
}

const statusRank: Record<string, number> = { active: 0, draft: 1, ended: 2 };

export function staysOnDay(stays: ResidentStay[], dayMs: number): ResidentStay[] {
  return stays
    .filter((s) => stayCoversDay(s, dayMs))
    .sort((a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9));
}

export type ResidentCalendarCell = {
  date: Date;
  dayMs: number;
  inMonth: boolean;
  isToday: boolean;
  stays: ResidentStay[];
};

export function buildResidentMonthGrid(
  year: number,
  month: number,
  stays: ResidentStay[],
  weekStartsOn: 0 | 1,
): ResidentCalendarCell[] {
  const todayMs = utcDayMs(new Date().toISOString());
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startDow = firstOfMonth.getUTCDay();
  const offset = (startDow - weekStartsOn + 7) % 7;
  const gridStart = new Date(Date.UTC(year, month, 1 - offset));

  const cells: ResidentCalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getTime() + i * 86_400_000);
    const dayMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    cells.push({
      date,
      dayMs,
      inMonth: date.getUTCMonth() === month,
      isToday: dayMs === todayMs,
      stays: staysOnDay(stays, dayMs),
    });
  }
  return cells;
}

export function formatStayLabel(stay: ResidentStay): string {
  if (stay.propertyName) {
    return `${stay.unitLabel} · ${stay.propertyName}`;
  }
  return stay.unitLabel;
}

export function formatStayRange(
  stay: ResidentStay,
  locale: string,
  openEndedLabel: string,
): string {
  const fmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const start = fmt.format(new Date(utcDayMs(stay.startDate)));
  if (!stay.endDate) return `${start} – ${openEndedLabel}`;
  const end = fmt.format(new Date(utcDayMs(stay.endDate)));
  return `${start} – ${end}`;
}

export function currentActiveStay(stays: ResidentStay[], nowMs = utcDayMs(new Date().toISOString())): ResidentStay | undefined {
  return stays.find((s) => s.status === "active" && stayCoversDay(s, nowMs));
}
