import type { Invoice, Lease, LeaseUnitRef, WalletLedgerEntry } from "@/lib/api/types";

export type { LeaseUnitRef };

export type PaymentUnitContext = {
  leases: Lease[];
  leaseUnits: LeaseUnitRef[];
};

function formatUnitLine(ref: LeaseUnitRef): string {
  if (ref.propertyName?.trim()) {
    return `${ref.propertyName.trim()} · ${ref.label}`;
  }
  return ref.label;
}

function unitRefById(ctx: PaymentUnitContext, unitId: string): LeaseUnitRef | undefined {
  return ctx.leaseUnits.find((u) => u.unitId === unitId);
}

function unitLineForLeaseId(ctx: PaymentUnitContext, leaseId: string): string | undefined {
  const lease = ctx.leases.find((l) => l.id === leaseId);
  if (!lease) return undefined;
  const ref = unitRefById(ctx, lease.unitId);
  return ref ? formatUnitLine(ref) : undefined;
}

function guessLeaseForLedger(row: WalletLedgerEntry, leases: Lease[]): Lease | undefined {
  const at = new Date(row.createdAt).getTime();
  const amount = row.amountSatang / 100;
  let best: Lease | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const lease of leases) {
    const delta = Math.abs(new Date(lease.createdAt).getTime() - at);
    if (delta > 120_000) continue;
    if (Math.abs(lease.rent.amount - amount) > 0.01) continue;
    if (delta < bestDelta) {
      best = lease;
      bestDelta = delta;
    }
  }
  return best;
}

export function resolvePaymentUnitLine(
  ctx: PaymentUnitContext,
  opts: {
    leaseId?: string;
    unitId?: string;
    ledgerRow?: WalletLedgerEntry;
  },
): string | undefined {
  if (opts.unitId) {
    const ref = unitRefById(ctx, opts.unitId);
    if (ref) return formatUnitLine(ref);
  }
  if (opts.leaseId) {
    const line = unitLineForLeaseId(ctx, opts.leaseId);
    if (line) return line;
  }
  if (opts.ledgerRow) {
    if (opts.ledgerRow.unitId) {
      const ref = unitRefById(ctx, opts.ledgerRow.unitId);
      if (ref) return formatUnitLine(ref);
    }
    if (opts.ledgerRow.leaseId) {
      const line = unitLineForLeaseId(ctx, opts.ledgerRow.leaseId);
      if (line) return line;
    }
    const guessed = guessLeaseForLedger(opts.ledgerRow, ctx.leases);
    if (guessed) {
      const ref = unitRefById(ctx, guessed.unitId);
      if (ref) return formatUnitLine(ref);
    }
  }
  return undefined;
}

export function paymentUnitContextFromSummary(me: {
  leases: Lease[];
  leaseUnits?: LeaseUnitRef[];
  primaryUnit?: { id: string; label: string };
  property?: { name: string };
}): PaymentUnitContext {
  const leaseUnits = [...(me.leaseUnits ?? [])];
  if (me.primaryUnit && !leaseUnits.some((u) => u.unitId === me.primaryUnit!.id)) {
    leaseUnits.push({
      unitId: me.primaryUnit.id,
      label: me.primaryUnit.label,
      propertyName: me.property?.name,
    });
  }
  return { leases: me.leases, leaseUnits };
}

export function resolveInvoiceUnitLine(ctx: PaymentUnitContext, inv: Invoice): string | undefined {
  return resolvePaymentUnitLine(ctx, { leaseId: inv.leaseId });
}
