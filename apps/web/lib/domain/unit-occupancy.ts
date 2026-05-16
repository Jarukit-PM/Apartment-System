import type { Lease, Resident } from "@/lib/api/types";

export type OccupancyLease = {
  id: string;
  startDate: string;
  endDate?: string;
  status: string;
  residentNames: string[];
};

/** UTC midnight timestamp for the calendar day of an ISO datetime. */
export function utcDayMs(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function residentNameMap(residents: Resident[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of residents) {
    m.set(r.id, r.fullName);
  }
  return m;
}

export function leasesToOccupancy(leases: Lease[], residents: Map<string, string>): OccupancyLease[] {
  return leases.map((lease) => ({
    id: lease.id,
    startDate: lease.startDate,
    endDate: lease.endDate,
    status: lease.status,
    residentNames: lease.residentIds.map((id) => residents.get(id) ?? id.slice(-6)),
  }));
}

export function leaseCoversDay(lease: OccupancyLease, dayMs: number): boolean {
  const start = utcDayMs(lease.startDate);
  if (dayMs < start) return false;
  if (lease.endDate) {
    return dayMs <= utcDayMs(lease.endDate);
  }
  return true;
}

const statusRank: Record<string, number> = { active: 0, draft: 1, ended: 2 };

export function occupantsOnDay(leases: OccupancyLease[], dayMs: number): OccupancyLease[] {
  return leases
    .filter((l) => leaseCoversDay(l, dayMs))
    .sort((a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9));
}

export type CalendarCell = {
  date: Date;
  dayMs: number;
  inMonth: boolean;
  isToday: boolean;
  occupants: OccupancyLease[];
};

export function buildMonthGrid(year: number, month: number, leases: OccupancyLease[], weekStartsOn: 0 | 1): CalendarCell[] {
  const todayMs = utcDayMs(new Date().toISOString());
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startDow = firstOfMonth.getUTCDay();
  const offset = (startDow - weekStartsOn + 7) % 7;
  const gridStart = new Date(Date.UTC(year, month, 1 - offset));

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getTime() + i * 86_400_000);
    const dayMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    cells.push({
      date,
      dayMs,
      inMonth: date.getUTCMonth() === month,
      isToday: dayMs === todayMs,
      occupants: occupantsOnDay(leases, dayMs),
    });
  }
  return cells;
}

export function formatResidentLabel(names: string[], moreLabel: string): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names[0]} ${moreLabel.replace("{count}", String(names.length - 1))}`;
}

export function formatLeaseRange(
  lease: OccupancyLease,
  locale: string,
  openEndedLabel: string,
): string {
  const fmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const start = fmt.format(new Date(utcDayMs(lease.startDate)));
  if (!lease.endDate) return `${start} – ${openEndedLabel}`;
  const end = fmt.format(new Date(utcDayMs(lease.endDate)));
  return `${start} – ${end}`;
}
