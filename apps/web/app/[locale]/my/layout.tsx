import { getTranslations, setRequestLocale } from "next-intl/server";
import { PortalNav } from "@/components/layout/portal-nav";
import { PortalShell } from "@/components/layout/portal-shell";
import { SidebarUserPanelSlot } from "@/components/layout/sidebar-user-panel-slot";
import { getSessionUser } from "@/lib/auth/session-user";

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
  const user = await getSessionUser();
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
        <SidebarUserPanelSlot
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
