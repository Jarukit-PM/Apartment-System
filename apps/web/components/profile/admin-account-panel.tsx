import { Building2, LayoutDashboard, Shield, User, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LogoutForm } from "@/components/auth/logout-form";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileQuickActions, type ProfileQuickAction } from "@/components/profile/profile-quick-actions";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SessionUser } from "@/lib/auth/session-user";

type Props = {
  locale: string;
  user: SessionUser;
};

export async function AdminAccountPanel({ locale, user }: Props) {
  const t = await getTranslations("ProfilePage");
  const roleLabel = user.isAdmin ? t("roleAdmin") : user.isResident ? t("roleResident") : t("roleGuest");

  const actions: ProfileQuickAction[] = [
    {
      href: "/dashboard",
      label: t("adminQuickActions.dashboard"),
      description: t("adminQuickActions.dashboardDesc"),
      icon: LayoutDashboard,
    },
    {
      href: "/wallet",
      label: t("adminQuickActions.wallet"),
      description: t("adminQuickActions.walletDesc"),
      icon: Wallet,
    },
    {
      href: "/properties",
      label: t("adminQuickActions.properties"),
      description: t("adminQuickActions.propertiesDesc"),
      icon: Building2,
    },
  ];

  if (user.isResident) {
    actions.push({
      href: "/my",
      label: t("adminQuickActions.myPortal"),
      description: t("adminQuickActions.myPortalDesc"),
      icon: User,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ProfileHero
        fullName={user.displayName}
        meta={<span>{user.email}</span>}
        badges={<StatusBadge>{roleLabel}</StatusBadge>}
      />

      <ProfileQuickActions title={t("quickActionsTitle")} actions={actions} />

      <SectionCard title={t("contactSection")} icon={User} eyebrow>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="ap-label !mb-1">{t("displayName")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{user.displayName}</dd>
          </div>
          <div>
            <dt className="ap-label !mb-1">{t("email")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{user.email}</dd>
          </div>
          <div>
            <dt className="ap-label !mb-1">{t("role")}</dt>
            <dd>
              <StatusBadge>{roleLabel}</StatusBadge>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title={t("securitySection")} icon={Shield} eyebrow description={t("securityDesc")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ap-muted)]">{t("signOutHint")}</p>
          <LogoutForm locale={locale} variant="profile" />
        </div>
      </SectionCard>
    </div>
  );
}
