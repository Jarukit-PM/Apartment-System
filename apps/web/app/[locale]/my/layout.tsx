import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PortalNav, type PortalNavSection } from "@/components/layout/portal-nav";
import { PortalShell } from "@/components/layout/portal-shell";
import { PortalTopBarQuickLinks } from "@/components/layout/portal-top-bar-quick-links";
import { PortalTopBarWallet } from "@/components/layout/portal-top-bar-wallet";
import { PortalTopBarWalletSkeleton } from "@/components/layout/portal-top-bar-wallet-skeleton";
import { SidebarUserPanelSlot } from "@/components/layout/sidebar-user-panel-slot";
import { getSessionUser } from "@/lib/auth/session-user";
import type { NavIconKey } from "@/components/layout/nav-icons";

type NavKey = "summary" | "profile" | "rentBook" | "wallet" | "invoices" | "maintenance";

function item(href: string, key: NavKey, label: string): PortalNavSection["items"][number] {
  return { href, label, iconKey: key as NavIconKey };
}

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

  const navSections: PortalNavSection[] = [
    {
      id: "home",
      label: t("navGroups.home"),
      items: [item("/my", "summary", t("nav.summary"))],
    },
    {
      id: "living",
      label: t("navGroups.living"),
      items: [
        item("/my/rent", "rentBook", t("nav.rentBook")),
        item("/my/maintenance", "maintenance", t("nav.maintenance")),
        item("/my/invoices", "invoices", t("nav.invoices")),
      ],
    },
    {
      id: "account",
      label: t("navGroups.account"),
      items: [
        item("/my/profile", "profile", t("nav.profile")),
        item("/my/wallet", "wallet", t("nav.wallet")),
      ],
    },
  ];

  const extraLinks = isAdmin ? [{ href: "/dashboard", label: t("adminConsole") }] : [];

  return (
    <PortalShell
      brand={t("brand")}
      title={t("title")}
      homeHref="/my"
      navSections={navSections}
      openMenuLabel={t("openMenu")}
      closeMenuLabel={t("closeMenu")}
      sidebarLabel={t("sidebarLabel")}
      breadcrumbLabel={t("breadcrumbLabel")}
      detailsLabel={t("detailsPage")}
      nav={<PortalNav sections={navSections} ariaLabel={t("navLabel")} />}
      topBarActions={
        <>
          <Suspense fallback={<PortalTopBarWalletSkeleton />}>
            <PortalTopBarWallet href="/my/wallet" locale={locale} label={t("topBar.wallet")} />
          </Suspense>
          <PortalTopBarQuickLinks
            ariaLabel={t("topBar.quickNavLabel")}
            links={[{ href: "/my/profile", label: t("topBar.profile"), iconKey: "profile" }]}
          />
        </>
      }
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
