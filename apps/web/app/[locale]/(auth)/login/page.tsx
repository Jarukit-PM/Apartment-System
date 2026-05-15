import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginPasswordForm } from "@/components/login-password-form";
import { isSafeAppPath } from "@/lib/url-guards";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const next = sp.next && isSafeAppPath(sp.next) ? sp.next : undefined;

  return (
    <article className="ap-glass-elevated mx-auto w-full max-w-md rounded-[var(--ap-radius-lg)] p-8 md:p-10">
      <h1 className="ap-headline text-xl">{t("loginTitle")}</h1>
      <p className="ap-body mt-2 text-sm">{t("loginSubtitle")}</p>

      {sp.error === "google" ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {t("googleError")}
        </p>
      ) : null}

      <div className="mt-8">
        <LoginPasswordForm
          locale={locale}
          next={next}
          emailLabel={t("email")}
          passwordLabel={t("password")}
          submitLabel={t("signIn")}
        />
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-[var(--ap-border)]" />
        </div>
        <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
          <span className="bg-[var(--ap-surface-elevated)] px-3 text-[var(--ap-muted)]">{t("divider")}</span>
        </div>
      </div>

      <GoogleSignIn locale={locale} caption={t("googleCaption")} next={next} />

      <p className="mt-8 text-center text-sm text-[var(--ap-muted)]">
        {t("needAccount")}{" "}
        <Link href="/register" className="font-medium text-[var(--ap-accent)] hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </article>
  );
}
