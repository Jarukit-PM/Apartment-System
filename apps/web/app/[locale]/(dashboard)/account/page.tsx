import { getTranslations, setRequestLocale } from "next-intl/server";
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
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <p className="mt-4 text-sm text-[var(--ap-muted)]">{t("notSignedIn")}</p>
      </div>
    );
  }

  const roleLabel = user.isAdmin ? t("roleAdmin") : user.isResident ? t("roleResident") : t("roleGuest");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("adminSubtitle")} />

      <section className="ap-card p-6 md:p-8">
        <h2 className="ap-eyebrow">{t("contactSection")}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
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
              <span className="inline-flex rounded-full bg-[var(--ap-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ap-accent)]">
                {roleLabel}
              </span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
