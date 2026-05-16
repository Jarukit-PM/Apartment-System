import { getTranslations } from "next-intl/server";
import { ArrowLeftRight, History, QrCode, Wallet } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { WalletTopUpClient } from "@/components/wallet/wallet-top-up-client";
import { apiGetJsonAuthed } from "@/lib/api/server";
import { walletTransfer } from "@/lib/actions/wallet";
import type { SingleWrapper, WalletBundle } from "@/lib/api/types";
import { formatThb } from "@/lib/domain/format-thb";
import { isWalletLedgerDebit } from "@/lib/domain/wallet-ledger";

export async function WalletPanel({ locale }: { locale: string }) {
  const t = await getTranslations("MyPortal");

  const res = await apiGetJsonAuthed<SingleWrapper<WalletBundle>>("/v1/wallet");

  if (!res.ok) {
    if (res.status === 401) {
      return (
        <div className="mx-auto max-w-3xl space-y-4">
          <PageHeader title={t("walletTitle")} icon={Wallet} />
          <p className="text-sm text-[var(--ap-muted)]">{t("walletSignInHint")}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader title={t("walletTitle")} icon={Wallet} />
        <p className="ap-alert-error">{t("loadError")}</p>
      </div>
    );
  }

  const { wallet, ledger } = res.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader title={t("walletTitle")} icon={Wallet} />

      <section className="ap-card ap-card-interactive p-8">
        <p className="ap-eyebrow">{t("walletBalanceSection")}</p>
        <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
          {formatThb(wallet.balanceSatang, locale)}
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="ap-label">{t("walletUserId")}</dt>
            <dd className="break-all font-mono text-xs text-[var(--foreground)]">{wallet.userId}</dd>
          </div>
          <div>
            <dt className="ap-label">{t("walletCurrency")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{wallet.currency}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[var(--ap-muted)]">{t("walletMinorHint")}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("walletTopUpTitle")} description={t("walletTopUpHint")} icon={QrCode}>
          <WalletTopUpClient locale={locale} />
        </SectionCard>

        <SectionCard title={t("walletTransferTitle")} description={t("walletTransferHint")} icon={ArrowLeftRight}>
          <ActionForm action={walletTransfer} locale={locale} submitLabel={t("walletTransferSubmit")}>
            <div>
              <label htmlFor="wallet-to-user" className="ap-label">
                {t("walletToUserLabel")}
              </label>
              <input
                id="wallet-to-user"
                name="toUserId"
                type="text"
                required
                placeholder="24-character hex user id"
                className="ap-input font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="wallet-tx-amount" className="ap-label">
                {t("walletAmountLabel")}
              </label>
              <input
                id="wallet-tx-amount"
                name="amountBaht"
                type="text"
                inputMode="decimal"
                placeholder="50.00"
                required
                className="ap-input"
              />
            </div>
          </ActionForm>
        </SectionCard>
      </div>

      <section>
        <h2 className="ap-eyebrow">{t("walletLedgerTitle")}</h2>
        {ledger.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={History} title={t("walletLedgerEmpty")} />
          </div>
        ) : (
          <ul className="ap-card mt-4 divide-y divide-[var(--ap-border)] overflow-hidden">
            {ledger.map((row) => {
              const label =
                row.kind === "top_up"
                  ? t("ledgerTopUp")
                  : row.kind === "transfer_out"
                    ? t("ledgerTransferOut")
                    : row.kind === "transfer_in"
                      ? t("ledgerTransferIn")
                      : row.kind === "lease_first_month"
                        ? t("ledgerLeaseFirstMonth")
                        : row.kind === "lease_booking_reversal"
                          ? t("ledgerLeaseBookingReversal")
                          : row.kind;
              const debit = isWalletLedgerDebit(row.kind);
              return (
                <li key={row.id} className="p-4 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-[var(--foreground)]">{label}</span>
                    <span
                      className={`tabular-nums font-semibold ${debit ? "text-red-700" : "text-[var(--ap-gold-deep)]"}`}
                    >
                      {debit ? "−" : "+"}
                      {formatThb(row.amountSatang, locale)}
                    </span>
                  </div>
                  {row.peerUserId ? (
                    <p className="mt-2 break-all font-mono text-xs text-[var(--ap-muted)]">
                      {t("walletPeer")}: {row.peerUserId}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--ap-muted)]">
                    {row.createdAt.slice(0, 19).replace("T", " ")} UTC
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
