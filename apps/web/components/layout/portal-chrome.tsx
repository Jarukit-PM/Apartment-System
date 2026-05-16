import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { PortalNav, type PortalNavSection } from "@/components/layout/portal-nav";
import { PortalShell } from "@/components/layout/portal-shell";
import { PortalTopBarQuickLinks } from "@/components/layout/portal-top-bar-quick-links";
import { PortalTopBarWallet } from "@/components/layout/portal-top-bar-wallet";
import { PortalTopBarWalletSkeleton } from "@/components/layout/portal-top-bar-wallet-skeleton";
import { SidebarUserPanelSlot } from "@/components/layout/sidebar-user-panel-slot";
import { getSessionUser } from "@/lib/auth/session-user";
import type { NavIconKey } from "@/components/layout/nav-icons";

type NavKey =
  | "dashboard"
  | "properties"
  | "units"
  | "residents"
  | "leases"
  | "maintenance"
  | "wallet";

function item(href: string, key: NavKey, label: string): PortalNavSection["items"][number] {
  return { href, label, iconKey: key as NavIconKey };
}

export async function PortalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [t, locale] = await Promise.all([getTranslations("Portal"), getLocale()]);
  const user = await getSessionUser();

  const navSections: PortalNavSection[] = [
    {
      id: "overview",
      label: t("navGroups.overview"),
      items: [item("/dashboard", "dashboard", t("nav.dashboard"))],
    },
    {
      id: "portfolio",
      label: t("navGroups.portfolio"),
      items: [
        item("/properties", "properties", t("nav.properties")),
        item("/units", "units", t("nav.units")),
        item("/residents", "residents", t("nav.residents")),
      ],
    },
    {
      id: "operations",
      label: t("navGroups.operations"),
      items: [
        item("/leases", "leases", t("nav.leases")),
        item("/maintenance", "maintenance", t("nav.maintenance")),
      ],
    },
    {
      id: "finance",
      label: t("navGroups.finance"),
      items: [item("/wallet", "wallet", t("nav.wallet"))],
    },
  ];

  return (
    <PortalShell
      brand={t("brand")}
      title={t("console")}
      homeHref="/dashboard"
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
            <PortalTopBarWallet href="/wallet" locale={locale} label={t("topBar.wallet")} />
          </Suspense>
          <PortalTopBarQuickLinks
            ariaLabel={t("topBar.quickNavLabel")}
            links={[
              {
                href: user?.isResident ? "/my/profile" : "/account",
                label: t("topBar.profile"),
                iconKey: "profile",
              },
            ]}
          />
        </>
      }
      sidebarFooter={
        <SidebarUserPanelSlot
          user={user}
          locale={locale}
          profileHref={user ? (user.isResident ? "/my/profile" : "/account") : undefined}
          extraLinks={[{ href: "/my", label: t("myPortal") }]}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
