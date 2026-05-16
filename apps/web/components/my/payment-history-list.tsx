import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PaymentHistoryEntry } from "@/lib/domain/build-payment-history";
import { formatInvoiceAmount } from "@/lib/domain/format-invoice-amount";
import { formatLocaleDate } from "@/lib/domain/format-date";

export type PaymentHistoryLabels = {
  empty: string;
  colDate: string;
  colDescription: string;
  colUnit: string;
  colAmount: string;
  colStatus: string;
  statusCompleted: string;
  statusPending: string;
  statusRefund: string;
  ledgerLeaseFirstMonth: string;
  ledgerLeaseBookingReversal: string;
};

type Props = {
  locale: string;
  entries: PaymentHistoryEntry[];
  labels: PaymentHistoryLabels;
  limit?: number;
};

function entryLabel(entry: PaymentHistoryEntry, labels: PaymentHistoryLabels): string {
  if (entry.source === "wallet") {
    if (entry.label === "lease_first_month") return labels.ledgerLeaseFirstMonth;
    if (entry.label === "lease_booking_reversal") return labels.ledgerLeaseBookingReversal;
  }
  return entry.label;
}

function statusLabel(entry: PaymentHistoryEntry, labels: PaymentHistoryLabels): string {
  if (entry.status === "completed") return labels.statusCompleted;
  if (entry.status === "refund") return labels.statusRefund;
  return labels.statusPending;
}

function statusBadgeVariant(entry: PaymentHistoryEntry): "success" | "warning" | "muted" {
  if (entry.status === "completed") return "success";
  if (entry.status === "refund") return "muted";
  return "warning";
}

function formatSignedAmount(
  entry: PaymentHistoryEntry,
  locale: string,
): { text: string; className: string } {
  const formatted = formatInvoiceAmount(entry.amount, entry.currency, locale);
  if (entry.status === "refund") {
    return { text: `+${formatted}`, className: "text-[var(--ap-gold-deep)]" };
  }
  if (entry.status === "completed") {
    return { text: `−${formatted}`, className: "text-red-700" };
  }
  return { text: formatted, className: "text-[var(--foreground)]" };
}

function PaymentHistoryRow({
  entry,
  labels,
  locale,
  variant,
}: {
  entry: PaymentHistoryEntry;
  labels: PaymentHistoryLabels;
  locale: string;
  variant: "card" | "table";
}) {
  const description = entryLabel(entry, labels);
  const amount = formatSignedAmount(entry, locale);
  const date = formatLocaleDate(entry.occurredAt, locale);
  const unit = entry.unitLine ?? "—";
  const badge = (
    <StatusBadge variant={statusBadgeVariant(entry)}>{statusLabel(entry, labels)}</StatusBadge>
  );

  if (variant === "card") {
    return (
      <li className="rounded-[var(--ap-radius)] border border-[var(--ap-border)] bg-[var(--ap-surface-solid)] p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-[var(--ap-muted)]">{date}</p>
          {badge}
        </div>
        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{description}</p>
        <p className="mt-1 text-sm text-[var(--ap-muted)]">{unit}</p>
        <p
          className={`mt-3 text-right text-base font-semibold tabular-nums tracking-tight whitespace-nowrap ${amount.className}`}
        >
          {amount.text}
        </p>
      </li>
    );
  }

  return (
    <tr className="align-middle">
      <td className="whitespace-nowrap text-[var(--ap-muted)]">{date}</td>
      <td className="min-w-[9rem] max-w-[14rem] font-medium leading-snug">{description}</td>
      <td className="min-w-[8rem] max-w-[12rem] text-sm leading-snug text-[var(--ap-muted)]">
        {unit}
      </td>
      <td className="w-0 whitespace-nowrap text-right">
        <span
          className={`inline-block font-semibold tabular-nums tracking-tight ${amount.className}`}
        >
          {amount.text}
        </span>
      </td>
      <td className="w-0 whitespace-nowrap text-right">{badge}</td>
    </tr>
  );
}

export function PaymentHistoryList({ locale, entries, labels, limit }: Props) {
  const rows = limit != null ? entries.slice(0, limit) : entries;

  if (entries.length === 0) {
    return <EmptyState icon={History} title={labels.empty} />;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3 md:hidden" role="list">
        {rows.map((entry) => (
          <PaymentHistoryRow
            key={entry.id}
            entry={entry}
            labels={labels}
            locale={locale}
            variant="card"
          />
        ))}
      </ul>

      <div className="ap-table-wrap hidden md:block">
        <table className="ap-table ap-table-payment-history">
          <thead>
            <tr>
              <th className="w-[7.5rem]">{labels.colDate}</th>
              <th>{labels.colDescription}</th>
              <th className="min-w-[8rem]">{labels.colUnit}</th>
              <th className="w-[6.5rem] text-right">{labels.colAmount}</th>
              <th className="w-[6.5rem] text-right">{labels.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <PaymentHistoryRow
                key={entry.id}
                entry={entry}
                labels={labels}
                locale={locale}
                variant="table"
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
