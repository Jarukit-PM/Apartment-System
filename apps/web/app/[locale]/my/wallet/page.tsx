import { setRequestLocale } from "next-intl/server";
import { WalletPanel } from "@/components/wallet/wallet-panel";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyWalletPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WalletPanel locale={locale} />;
}
