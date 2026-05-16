import { Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { SingleWrapper, WalletBundle } from "@/lib/api/types";
import { formatThb } from "@/lib/domain/format-thb";

type Props = {
  href: string;
  locale: string;
  label: string;
};

export async function PortalTopBarWallet({ href, locale, label }: Props) {
  const res = await apiGetJsonAuthed<SingleWrapper<WalletBundle>>("/v1/wallet");
  if (!res.ok) return null;

  const balance = formatThb(res.data.data.wallet.balanceSatang, locale);

  return (
    <Link href={href} className="ap-topbar-wallet" aria-label={`${label}: ${balance}`}>
      <Wallet className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="ap-topbar-wallet-balance">{balance}</span>
    </Link>
  );
}
