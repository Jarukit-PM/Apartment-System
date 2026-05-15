import { getTranslations } from "next-intl/server";
import { SidebarProfileMenu } from "@/components/sidebar-profile-menu";
import type { SessionUser } from "@/lib/session-user";

type ExtraLink = {
  href: string;
  label: string;
};

type Props = {
  user: SessionUser | null;
  locale: string;
  extraLinks?: ExtraLink[];
  profileHref?: string;
};

export async function SidebarUserPanel({ user, locale, extraLinks = [], profileHref }: Props) {
  const t = await getTranslations("Sidebar");

  if (!user) {
    return <p className="text-sm text-[var(--ap-muted)]">{t("notSignedIn")}</p>;
  }

  return (
    <SidebarProfileMenu
      user={{
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
        isResident: user.isResident,
      }}
      locale={locale}
      profileHref={profileHref}
      extraLinks={extraLinks}
      labels={{
        language: t("language"),
        signOut: t("signOut"),
        viewProfile: t("viewProfile"),
        menuLabel: t("menuLabel"),
        localeEn: t("localeEn"),
        localeTh: t("localeTh"),
      }}
    />
  );
}
