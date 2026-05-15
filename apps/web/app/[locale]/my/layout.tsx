import { getTranslations, setRequestLocale } from "next-intl/server";
import { PortalNav } from "@/components/portal-nav";
import { PortalShell } from "@/components/portal-shell";
import { SidebarUserPanel } from "@/components/sidebar-user-panel";
import { enrichSessionUser, getSessionUser } from "@/lib/session-user";

const links = [
  { href: "/my", key: "summary" as const },
  { href: "/my/profile", key: "profile" as const },
  { href: "/my/rent", key: "rentBook" as const },
  { href: "/my/wallet", key: "wallet" as const },
  { href: "/my/invoices", key: "invoices" as const },
  { href: "/my/maintenance", key: "maintenance" as const },
];

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function MyPortalLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal");
  const rawUser = await getSessionUser();
  const user = rawUser ? await enrichSessionUser(rawUser) : null;
  const isAdmin = user?.isAdmin ?? false;

  const navItems = links.map((l) => ({
    href: l.href,
    label: t(`nav.${l.key}`),
  }));

  const extraLinks = isAdmin
    ? [{ href: "/dashboard", label: t("adminConsole") }]
    : [];

  return (
    <PortalShell
      brand={t("brand")}
      title={t("title")}
      nav={<PortalNav items={navItems} ariaLabel={t("navLabel")} />}
      sidebarFooter={
        <SidebarUserPanel
          user={user}
          locale={locale}
          profileHref="/my/profile"
          extraLinks={extraLinks}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
