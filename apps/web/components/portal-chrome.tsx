import { getLocale, getTranslations } from "next-intl/server";
import { PortalNav } from "@/components/portal-nav";
import { PortalShell } from "@/components/portal-shell";
import { SidebarUserPanel } from "@/components/sidebar-user-panel";
import { enrichSessionUser, getSessionUser } from "@/lib/session-user";

const links = [
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/properties", key: "properties" as const },
  { href: "/units", key: "units" as const },
  { href: "/residents", key: "residents" as const },
  { href: "/leases", key: "leases" as const },
  { href: "/maintenance", key: "maintenance" as const },
  { href: "/wallet", key: "wallet" as const },
];

export async function PortalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [t, locale] = await Promise.all([getTranslations("Portal"), getLocale()]);
  const rawUser = await getSessionUser();
  const user = rawUser ? await enrichSessionUser(rawUser) : null;

  const navItems = links.map((l) => ({
    href: l.href,
    label: t(`nav.${l.key}`),
  }));

  return (
    <PortalShell
      brand={t("brand")}
      title={t("console")}
      nav={<PortalNav items={navItems} ariaLabel={t("navLabel")} />}
      sidebarFooter={
        <SidebarUserPanel
          user={user}
          locale={locale}
          profileHref={user ? (user.isResident ? "/my/profile" : "/account") : undefined}
          extraLinks={[
            { href: "/my", label: t("myPortal") },
          ]}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
