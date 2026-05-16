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
  variant?: "sidebar" | "topbar";
};

export async function SidebarUserPanel({
  user,
  locale,
  extraLinks = [],
  profileHref,
  variant = "sidebar",
}: Props) {
  const t = await getTranslations("Sidebar");

  if (!user) {
    if (variant === "topbar") return null;
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
      variant={variant}
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
