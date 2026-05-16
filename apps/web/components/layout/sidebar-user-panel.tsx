import { getTranslations } from "next-intl/server";
import { SidebarProfileMenu } from "@/components/layout/sidebar-profile-menu";
import { enrichSessionUser, type SessionUser } from "@/lib/auth/session-user";

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

  const resolved = user.residentId ? await enrichSessionUser(user) : user;

  return (
    <SidebarProfileMenu
      user={{
        displayName: resolved.displayName,
        email: resolved.email,
        isAdmin: resolved.isAdmin,
        isResident: resolved.isResident,
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
