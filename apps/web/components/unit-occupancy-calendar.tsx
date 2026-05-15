"use client";

import { useMemo, useState } from "react";
import {
  buildMonthGrid,
  formatLeaseRange,
  formatResidentLabel,
  utcDayMs,
  type OccupancyLease,
} from "@/lib/unit-occupancy";

export type OccupancyCalendarLabels = {
  title: string;
  subtitle: string;
  prevMonth: string;
  nextMonth: string;
  vacancy: string;
  moreResidents: string;
  openEnded: string;
  leaseListTitle: string;
  statusActive: string;
  statusEnded: string;
  statusDraft: string;
  weekdays: string[];
};

type UnitOccupancyCalendarProps = {
  locale: string;
  leases: OccupancyLease[];
  labels: OccupancyCalendarLabels;
};

function statusStyle(status: string): string {
  switch (status) {
    case "active":
      return "bg-[var(--ap-accent-soft)] border-[var(--ap-accent)] text-[var(--foreground)]";
    case "ended":
      return "bg-zinc-100 border-zinc-300 text-zinc-600";
    case "draft":
      return "bg-amber-50 border-amber-300 text-amber-900 border-dashed";
    default:
      return "bg-[#faf8f5] border-[var(--ap-border)] text-[var(--ap-muted)]";
  }
}

function statusLabel(status: string, labels: OccupancyCalendarLabels): string {
  switch (status) {
    case "active":
      return labels.statusActive;
    case "ended":
      return labels.statusEnded;
    case "draft":
      return labels.statusDraft;
    default:
      return status;
  }
}

export function UnitOccupancyCalendar({ locale, leases, labels }: UnitOccupancyCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth());
  const weekStartsOn: 0 | 1 = locale === "th" ? 1 : 0;

  const monthTitle = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));

  const cells = useMemo(
    () => buildMonthGrid(year, month, leases, weekStartsOn),
    [year, month, leases, weekStartsOn],
  );

  const monthLeases = useMemo(() => {
    const monthStart = Date.UTC(year, month, 1);
    const monthEnd = Date.UTC(year, month + 1, 0);
    return leases
      .filter((l) => {
        const start = utcDayMs(l.startDate);
        const end = l.endDate ? utcDayMs(l.endDate) : Number.MAX_SAFE_INTEGER;
        return start <= monthEnd && end >= monthStart;
      })
      .sort((a, b) => utcDayMs(a.startDate) - utcDayMs(b.startDate));
  }, [leases, year, month]);

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="ap-eyebrow">{labels.title}</h2>
        <p className="mt-1 text-sm text-[var(--ap-muted)]">{labels.subtitle}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="ap-btn ap-btn-secondary !px-3 !py-1.5 text-sm"
          aria-label={labels.prevMonth}
        >
          ←
        </button>
        <p className="text-center text-sm font-semibold text-[var(--foreground)]">{monthTitle}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="ap-btn ap-btn-secondary !px-3 !py-1.5 text-sm"
          aria-label={labels.nextMonth}
        >
          →
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--ap-muted)]">
            {labels.weekdays.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const primary = cell.occupants[0];
              const label = primary
                ? formatResidentLabel(primary.residentNames, labels.moreResidents)
                : cell.inMonth
                  ? labels.vacancy
                  : "";
              return (
                <div
                  key={cell.dayMs}
                  className={`flex min-h-[4.5rem] flex-col rounded-lg border p-1 text-left ${
                    cell.inMonth
                      ? "border-[var(--ap-border)] bg-white"
                      : "border-transparent bg-transparent opacity-40"
                  } ${cell.isToday ? "ring-2 ring-[var(--ap-accent)] ring-offset-1" : ""}`}
                  title={
                    primary
                      ? `${label} (${statusLabel(primary.status, labels)})`
                      : cell.inMonth
                        ? labels.vacancy
                        : undefined
                  }
                >
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      cell.inMonth ? "text-[var(--foreground)]" : "text-[var(--ap-muted)]"
                    }`}
                  >
                    {cell.date.getUTCDate()}
                  </span>
                  {primary && cell.inMonth ? (
                    <span
                      className={`mt-0.5 line-clamp-2 rounded border px-0.5 text-[10px] leading-tight ${statusStyle(primary.status)}`}
                    >
                      {label}
                    </span>
                  ) : cell.inMonth && cell.occupants.length === 0 ? (
                    <span className="mt-0.5 text-[10px] text-[var(--ap-muted)]">{labels.vacancy}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--ap-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-[var(--ap-accent)] bg-[var(--ap-accent-soft)]" />
          {labels.statusActive}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-zinc-300 bg-zinc-100" />
          {labels.statusEnded}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-dashed border-amber-300 bg-amber-50" />
          {labels.statusDraft}
        </span>
      </div>

      {monthLeases.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)]">{labels.leaseListTitle}</h3>
          <ul className="mt-3 space-y-2">
            {monthLeases.map((lease) => (
              <li
                key={lease.id}
                className={`rounded-lg border px-3 py-2 text-sm ${statusStyle(lease.status)}`}
              >
                <p className="font-medium">
                  {lease.residentNames.join(", ") || "—"}
                  <span className="ml-2 text-xs font-normal opacity-80">
                    ({statusLabel(lease.status, labels)})
                  </span>
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  {formatLeaseRange(lease, locale, labels.openEnded)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
