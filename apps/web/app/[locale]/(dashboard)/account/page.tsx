import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminAccountPanel } from "@/components/profile/admin-account-panel";
import { PageHeader } from "@/components/ui/page-header";
import { enrichSessionUser, getSessionUser } from "@/lib/auth/session-user";

type PageProps = { params: Promise<{ locale: string }> };

export default async function AccountPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ProfilePage");

  const raw = await getSessionUser();
  const user = raw ? await enrichSessionUser(raw) : null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("title")} />
        <p className="mt-4 text-sm text-[var(--ap-muted)]">{t("notSignedIn")}</p>
      </div>
    );
  }

  return <AdminAccountPanel locale={locale} user={user} />;
}
