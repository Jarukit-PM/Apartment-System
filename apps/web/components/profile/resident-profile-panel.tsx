import { History, Home, Mail, Phone, Receipt, Shield, Wallet, Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LogoutForm } from "@/components/auth/logout-form";
import { ProfileContactForm } from "@/components/profile/profile-contact-form";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileQuickActions, type ProfileQuickAction } from "@/components/profile/profile-quick-actions";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, statusVariant } from "@/components/ui/status-badge";
import { PaymentHistoryList } from "@/components/my/payment-history-list";
import type { Invoice, Lease, MeSummaryData, WalletLedgerEntry } from "@/lib/api/types";
import { buildPaymentHistory } from "@/lib/domain/build-payment-history";
import { paymentUnitContextFromSummary } from "@/lib/domain/resolve-payment-unit-line";
import { paymentHistoryLabels } from "@/lib/i18n/payment-history-labels";
import { formatLocaleDate } from "@/lib/domain/format-date";
import { formatThb } from "@/lib/domain/format-thb";

type Props = {
  locale: string;
  me: MeSummaryData;
  walletBalanceSatang?: number | null;
  openInvoiceCount?: number;
  invoices?: Invoice[];
  ledger?: WalletLedgerEntry[];
};

function leaseRentLabel(lease: Lease, locale: string): string {
  const tag = locale === "th" ? "th-TH" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: lease.rent.currency || "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(lease.rent.amount);
}

export async function ResidentProfilePanel({
  locale,
  me,
  walletBalanceSatang,
  openInvoiceCount = 0,
  invoices = [],
  ledger = [],
}: Props) {
  const [t, tPortal] = await Promise.all([
    getTranslations("ProfilePage"),
    getTranslations("MyPortal"),
  ]);
  const paymentHistory = buildPaymentHistory(invoices, ledger, paymentUnitContextFromSummary(me));
  const historyLabels = paymentHistoryLabels((key) => tPortal(key));
  const building = me.property?.name;
  const unitLabel = me.primaryUnit?.label;
  const active = me.activeLease;

  const walletDescription =
    walletBalanceSatang != null
      ? t("quickActions.walletBalance", { amount: formatThb(walletBalanceSatang, locale) })
      : t("quickActions.walletDesc");

  const quickActions: ProfileQuickAction[] = [
    {
      href: "/my/wallet",
      label: t("quickActions.wallet"),
      description: walletDescription,
      icon: Wallet,
    },
    {
      href: "/my/invoices",
      label: t("quickActions.invoices"),
      description: t("quickActions.invoicesDesc"),
      icon: Receipt,
      badge: openInvoiceCount > 0 ? String(openInvoiceCount) : undefined,
    },
    {
      href: "/my/maintenance",
      label: t("quickActions.maintenance"),
      description: t("quickActions.maintenanceDesc"),
      icon: Wrench,
    },
    {
      href: "/my/rent",
      label: t("quickActions.rent"),
      description: active ? t("quickActions.rentDescActive") : t("quickActions.rentDesc"),
      icon: Home,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ProfileHero
        fullName={me.resident.fullName}
        meta={
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-[var(--ap-gold-deep)]" strokeWidth={1.75} aria-hidden />
            {me.resident.email}
          </span>
        }
        badges={
          <>
            <StatusBadge variant="success">{t("roleResident")}</StatusBadge>
            {active ? (
              <StatusBadge variant={statusVariant(active.status)}>{active.status}</StatusBadge>
            ) : null}
          </>
        }
      />

      <ProfileQuickActions title={t("quickActionsTitle")} actions={quickActions} />

      <SectionCard id="contact" title={t("contactSection")} icon={Phone} eyebrow>
        <ProfileContactForm
          locale={locale}
          fullName={me.resident.fullName}
          email={me.resident.email}
          phone={me.resident.phone ?? ""}
          memberSince={formatLocaleDate(me.resident.createdAt, locale)}
          labels={{
            fullName: t("fullName"),
            email: t("email"),
            phone: t("phone"),
            memberSince: t("memberSince"),
            emailReadOnly: t("emailReadOnly"),
            save: t("saveProfile"),
            saved: t("saveSuccess"),
            contactHint: t("contactHint"),
          }}
        />
      </SectionCard>

      <SectionCard id="home" title={t("homeSection")} icon={Home} eyebrow>
        {building && unitLabel ? (
          <p className="text-sm font-medium text-[var(--foreground)]">
            {t("homeLine", { building, unit: unitLabel })}
          </p>
        ) : (
          <p className="text-sm text-[var(--ap-muted)]">{t("homeUnknown")}</p>
        )}

        {active ? (
          <dl className="mt-5 grid gap-4 border-t border-[var(--ap-border)] pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="ap-label !mb-1">{t("leaseRent")}</dt>
              <dd className="font-semibold tabular-nums text-[var(--foreground)]">
                {leaseRentLabel(active, locale)}
                {active.rentBasis ? (
                  <span className="ml-1 text-xs font-normal text-[var(--ap-muted)]">
                    / {active.rentBasis}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="ap-label !mb-1">{t("leasePeriod")}</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {formatLocaleDate(active.startDate, locale)}
                {active.endDate
                  ? ` – ${formatLocaleDate(active.endDate, locale)}`
                  : ` – ${t("leaseOpenEnded")}`}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="ap-label !mb-1">{t("leaseStatusLabel")}</dt>
              <dd>
                <StatusBadge variant={statusVariant(active.status)}>{active.status}</StatusBadge>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="ap-alert ap-alert-warning text-sm">{t("noActiveLease")}</p>
            <Link href="/my/rent" className="ap-btn ap-btn-secondary inline-flex text-sm">
              {t("browseUnits")}
            </Link>
          </div>
        )}

        {me.leases.length > 1 ? (
          <p className="mt-4 text-xs text-[var(--ap-muted)]">
            {t("leaseHistoryCount", { count: me.leases.length })}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard id="payments" title={t("paymentsSection")} icon={History} eyebrow>
        <PaymentHistoryList
          locale={locale}
          entries={paymentHistory}
          labels={historyLabels}
          limit={5}
        />
        {paymentHistory.length > 5 ? (
          <p className="mt-4 text-sm">
            <Link href="/my/invoices#payments" className="font-medium text-[var(--ap-accent)] hover:underline">
              {t("paymentsViewAll")}
            </Link>
          </p>
        ) : paymentHistory.length > 0 ? (
          <p className="mt-4 text-sm">
            <Link href="/my/invoices#payments" className="font-medium text-[var(--ap-accent)] hover:underline">
              {t("paymentsViewInvoices")}
            </Link>
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title={t("securitySection")} icon={Shield} eyebrow description={t("securityDesc")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ap-muted)]">{t("signOutHint")}</p>
          <LogoutForm locale={locale} variant="profile" />
        </div>
      </SectionCard>

      <p className="text-sm">
        <Link href="/my" className="font-medium text-[var(--ap-accent)] hover:underline">
          {t("backToSummary")}
        </Link>
      </p>
    </div>
  );
}
