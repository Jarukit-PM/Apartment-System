import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/action-form";
import { WalletTopUpClient } from "@/components/wallet-top-up-client";
import { apiGetJsonAuthed } from "@/lib/server-api";
import { walletTransfer } from "@/lib/wallet-actions";
import type { SingleWrapper, WalletBundle } from "@/lib/types";
import { isWalletLedgerDebit } from "@/lib/wallet-ledger";

function formatThb(satang: number, locale: string): string {
  const baht = satang / 100;
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht);
}

export async function WalletPanel({ locale }: { locale: string }) {
  const t = await getTranslations("MyPortal");

  const res = await apiGetJsonAuthed<SingleWrapper<WalletBundle>>("/v1/wallet");

  if (!res.ok) {
    if (res.status === 401) {
      return (
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("walletTitle")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("walletSignInHint")}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("walletTitle")}</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
      </div>
    );
  }

  const { wallet, ledger } = res.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("walletTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("walletSubtitle")}</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("walletBalanceSection")}
        </h2>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatThb(wallet.balanceSatang, locale)}
        </p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("walletUserId")}</dt>
            <dd className="break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">{wallet.userId}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("walletCurrency")}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">{wallet.currency}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">{t("walletMinorHint")}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("walletTopUpTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("walletTopUpHint")}</p>
          <WalletTopUpClient locale={locale} />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("walletTransferTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("walletTransferHint")}</p>
          <div className="mt-4">
            <ActionForm action={walletTransfer} locale={locale} submitLabel={t("walletTransferSubmit")}>
              <div>
                <label htmlFor="wallet-to-user" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {t("walletToUserLabel")}
                </label>
                <input
                  id="wallet-to-user"
                  name="toUserId"
                  type="text"
                  required
                  placeholder="24-character hex user id"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="wallet-tx-amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {t("walletAmountLabel")}
                </label>
                <input
                  id="wallet-tx-amount"
                  name="amountBaht"
                  type="text"
                  inputMode="decimal"
                  placeholder="50.00"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
              </div>
            </ActionForm>
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t("walletLedgerTitle")}</h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{t("walletLedgerEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
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
                <li
                  key={row.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
                    <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
                      {debit ? "−" : "+"}
                      {formatThb(row.amountSatang, locale)}
                    </span>
                  </div>
                  {row.peerUserId ? (
                    <p className="mt-2 break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {t("walletPeer")}: {row.peerUserId}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
