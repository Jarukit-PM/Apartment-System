import { getTranslations, setRequestLocale } from "next-intl/server";
import { History, Home, LayoutDashboard, Mail, Phone } from "lucide-react";
import { MyHomeSummary } from "@/components/my/my-home-summary";
import { PaymentHistoryList } from "@/components/my/payment-history-list";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { Invoice, ListWrapper, MeSummaryData, SingleWrapper, WalletBundle } from "@/lib/api/types";
import { buildPaymentHistory } from "@/lib/domain/build-payment-history";
import { paymentUnitContextFromSummary } from "@/lib/domain/resolve-payment-unit-line";
import { paymentHistoryLabels } from "@/lib/i18n/payment-history-labels";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MySummaryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal");

  const [summaryRes, invoicesRes, walletRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<MeSummaryData>>("/v1/me/summary"),
    apiGetJsonAuthed<ListWrapper<Invoice>>("/v1/me/invoices"),
    apiGetJsonAuthed<SingleWrapper<WalletBundle>>("/v1/wallet"),
  ]);

  if (!summaryRes.ok) {
    if (summaryRes.status === 403) {
      return (
        <div className="mx-auto max-w-xl space-y-4">
          <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />
        </div>
      );
    }
    if (summaryRes.status === 404) {
      return (
        <div className="mx-auto max-w-xl space-y-4">
          <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />
          <p className="ap-alert-error">{t("loadError404Resident")}</p>
          {summaryRes.error?.message ? (
            <p className="text-xs text-[var(--ap-muted)]" role="status">
              {summaryRes.error.message}
            </p>
          ) : null}
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />
        <p className="ap-alert-error">{t("loadError")}</p>
      </div>
    );
  }

  const me = summaryRes.data.data;
  const invoices = invoicesRes.ok ? invoicesRes.data.data : [];
  const ledger = walletRes.ok ? walletRes.data.data.ledger : [];
  const paymentHistory = buildPaymentHistory(invoices, ledger, paymentUnitContextFromSummary(me));
  const historyLabels = paymentHistoryLabels(t);
  const building = me.property?.name;
  const unitLabel = me.primaryUnit?.label;
  const homeLine =
    building && unitLabel ? t("homeLine", { building, unit: unitLabel }) : "";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t("summaryTitle")} icon={LayoutDashboard} />

      <SectionCard
        title={t("profileSection")}
        icon={Mail}
        eyebrow
        href="/my/profile#contact"
        linkLabel={t("summaryProfileLink")}
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="ap-label">{t("email")}</dt>
            <dd className="flex items-center gap-2 font-medium text-[var(--foreground)]">
              <Mail className="h-4 w-4 text-[var(--ap-gold-deep)]" strokeWidth={1.75} aria-hidden />
              {me.resident.email}
            </dd>
          </div>
          {me.resident.phone ? (
            <div>
              <dt className="ap-label">{t("phone")}</dt>
              <dd className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <Phone className="h-4 w-4 text-[var(--ap-gold-deep)]" strokeWidth={1.75} aria-hidden />
                {me.resident.phone}
              </dd>
            </div>
          ) : null}
        </dl>
      </SectionCard>

      <SectionCard
        title={t("homeSection")}
        icon={Home}
        eyebrow
        href={me.activeLease ? "/my/profile#home" : "/my/rent"}
        linkLabel={t("summaryHomeLink")}
      >
        <MyHomeSummary
          locale={locale}
          homeLine={homeLine}
          unit={me.primaryUnit}
          property={me.property}
          activeLease={me.activeLease}
          labels={{
            homeLine,
            homeUnknown: t("homeUnknown"),
            leaseStatus: t("leaseStatus", { status: me.activeLease?.status ?? "" }),
            noActiveLease: t("noActiveLease"),
            summaryRentLink: t("summaryRentLink"),
            leaseEnds: t("summaryLeaseEnds"),
            leaseOpenEnded: t("summaryLeaseOpenEnded"),
            nextBilling: t("summaryNextBilling"),
            nextBillingUnknown: t("summaryNextBillingUnknown"),
          }}
        />
      </SectionCard>

      <SectionCard
        title={t("paymentHistoryTitle")}
        icon={History}
        eyebrow
        href="/my/invoices#payments"
        linkLabel={t("summaryPaymentsLink")}
      >
        <PaymentHistoryList
          locale={locale}
          entries={paymentHistory}
          labels={historyLabels}
          limit={3}
        />
      </SectionCard>
    </div>
  );
}
