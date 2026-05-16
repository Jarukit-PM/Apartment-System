import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { IconUserPlus } from "@/components/auth/auth-icons";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { LoginPasswordForm } from "@/components/auth/login-password-form";

type Props = {
  locale: string;
  next?: string;
  error?: string;
};

export async function LoginPanel({ locale, next, error }: Props) {
  const t = await getTranslations("Auth");

  return (
    <article className="ap-glass-elevated w-full rounded-[var(--ap-radius-lg)] p-8 md:p-10">
      <AuthCardHeader title={t("loginTitle")} variant="login" />

      {error === "google" ? (
        <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
          {t("googleError")}
        </p>
      ) : null}

      <div className="mt-8">
        <LoginPasswordForm
          locale={locale}
          next={next}
          formLabel={t("loginFormLabel")}
          emailLabel={t("email")}
          passwordLabel={t("password")}
          submitLabel={t("signIn")}
          showPasswordLabel={t("showPassword")}
          hidePasswordLabel={t("hidePassword")}
          navigatingLabel={t("navigating")}
        />
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-[var(--ap-border)]" />
        </div>
        <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
          <span className="bg-[var(--ap-surface-solid)] px-3 text-[var(--ap-muted)]">{t("divider")}</span>
        </div>
      </div>

      <GoogleSignIn locale={locale} next={next} navigatingLabel={t("navigating")} />

      <p className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-[var(--ap-muted)]">
        <span>{t("needAccount")}</span>
        <Link
          href="/register"
          className="inline-flex items-center gap-1 font-medium text-[var(--ap-accent)] hover:underline"
        >
          <IconUserPlus className="h-4 w-4 shrink-0 text-[var(--ap-gold-deep)]" />
          {t("registerLink")}
        </Link>
      </p>

      <p className="mt-6 text-center text-xs leading-relaxed text-[var(--ap-muted)]">{t("securityNote")}</p>
    </article>
  );
}
