import type { Invoice, WalletLedgerEntry } from "@/lib/api/types";
import {
  type PaymentUnitContext,
  resolveInvoiceUnitLine,
  resolvePaymentUnitLine,
} from "@/lib/domain/resolve-payment-unit-line";

export type PaymentHistoryStatus = "completed" | "pending" | "refund";

export type PaymentHistoryEntry = {
  id: string;
  status: PaymentHistoryStatus;
  label: string;
  unitLine?: string;
  amount: number;
  currency: string;
  occurredAt: string;
  source: "invoice" | "wallet";
};

const RENT_LEDGER_KINDS = new Set(["lease_first_month", "lease_booking_reversal"]);

function invoiceStatus(status: string): PaymentHistoryStatus {
  if (status === "paid") return "completed";
  return "pending";
}

/** Merge paid/open invoices and rent-related wallet ledger rows into a single timeline (newest first). */
export function buildPaymentHistory(
  invoices: Invoice[],
  ledger: WalletLedgerEntry[],
  unitContext: PaymentUnitContext,
): PaymentHistoryEntry[] {
  const items: PaymentHistoryEntry[] = [];

  for (const inv of invoices) {
    items.push({
      id: `invoice:${inv.id}`,
      status: invoiceStatus(inv.status),
      label: inv.description,
      unitLine: resolveInvoiceUnitLine(unitContext, inv),
      amount: inv.amount,
      currency: inv.currency || "THB",
      occurredAt: inv.status === "paid" ? inv.updatedAt : inv.dueDate,
      source: "invoice",
    });
  }

  for (const row of ledger) {
    if (!RENT_LEDGER_KINDS.has(row.kind)) continue;
    items.push({
      id: `wallet:${row.id}`,
      status: row.kind === "lease_booking_reversal" ? "refund" : "completed",
      label: row.kind,
      unitLine: resolvePaymentUnitLine(unitContext, { ledgerRow: row }),
      amount: row.amountSatang / 100,
      currency: "THB",
      occurredAt: row.createdAt,
      source: "wallet",
    });
  }

  return items.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}
