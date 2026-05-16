import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ResidentProfilePanel } from "@/components/profile/resident-profile-panel";
import { PageHeader } from "@/components/ui/page-header";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { Invoice, ListWrapper, MeSummaryData, SingleWrapper, WalletBundle } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ProfilePage");

  const [summaryRes, walletRes, invoicesRes] = await Promise.all([
    apiGetJsonAuthed<SingleWrapper<MeSummaryData>>("/v1/me/summary"),
    apiGetJsonAuthed<SingleWrapper<WalletBundle>>("/v1/wallet"),
    apiGetJsonAuthed<ListWrapper<Invoice>>("/v1/me/invoices"),
  ]);

  if (!summaryRes.ok) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <PageHeader title={t("title")} />
        <p className="text-sm text-red-600">
          {summaryRes.status === 403 ? t("forbidden") : t("loadError")}
        </p>
        {summaryRes.status === 403 ? (
          <Link href="/dashboard" className="ap-btn ap-btn-secondary inline-flex">
            {t("adminConsole")}
          </Link>
        ) : null}
      </div>
    );
  }

  const me = summaryRes.data.data;
  const walletBalanceSatang = walletRes.ok ? walletRes.data.data.wallet.balanceSatang : null;
  const invoices = invoicesRes.ok ? invoicesRes.data.data : [];
  const ledger = walletRes.ok ? walletRes.data.data.ledger : [];
  const openInvoiceCount = invoices.filter((inv) => inv.status !== "paid").length;

  return (
    <ResidentProfilePanel
      locale={locale}
      me={me}
      walletBalanceSatang={walletBalanceSatang}
      openInvoiceCount={openInvoiceCount}
      invoices={invoices}
      ledger={ledger}
    />
  );
}
