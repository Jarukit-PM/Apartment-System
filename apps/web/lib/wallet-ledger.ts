/** Ledger kinds that decrease the user's balance (API stores amount as positive magnitude). */
const DEBIT_KINDS = new Set(["transfer_out", "lease_first_month"]);

export function isWalletLedgerDebit(kind: string): boolean {
  return DEBIT_KINDS.has(kind);
}
