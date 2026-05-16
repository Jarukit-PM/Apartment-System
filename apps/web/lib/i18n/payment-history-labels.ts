import type { PaymentHistoryLabels } from "@/components/my/payment-history-list";

/** Labels for payment history UI (MyPortal namespace). */
export function paymentHistoryLabels(t: (key: string) => string): PaymentHistoryLabels {
  return {
    empty: t("paymentHistoryEmpty"),
    colDate: t("paymentHistoryColDate"),
    colDescription: t("paymentHistoryColDescription"),
    colUnit: t("paymentHistoryColUnit"),
    colAmount: t("paymentHistoryColAmount"),
    colStatus: t("paymentHistoryColStatus"),
    statusCompleted: t("paymentHistoryStatusCompleted"),
    statusPending: t("paymentHistoryStatusPending"),
    statusRefund: t("paymentHistoryStatusRefund"),
    ledgerLeaseFirstMonth: t("ledgerLeaseFirstMonth"),
    ledgerLeaseBookingReversal: t("ledgerLeaseBookingReversal"),
  };
}
