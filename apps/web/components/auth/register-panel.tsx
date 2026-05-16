import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { IconLogIn } from "@/components/auth/auth-icons";
import { RegisterResidentForm } from "@/components/auth/register-resident-form";

type Props = {
  locale: string;
};

export async function RegisterPanel({ locale }: Props) {
  const t = await getTranslations("Auth");

  return (
    <article className="ap-glass-elevated w-full rounded-[var(--ap-radius-lg)] p-8 md:p-10">
      <AuthCardHeader title={t("registerTitle")} subtitle={t("registerSubtitle")} variant="register" />

      <div className="mt-8">
        <RegisterResidentForm
          locale={locale}
          labels={{
            formLabel: t("registerFormLabel"),
            fullName: t("fullName"),
            email: t("email"),
            phone: t("phoneOptional"),
            password: t("password"),
            passwordHint: t("passwordHint"),
            submit: t("createAccount"),
            showPassword: t("showPassword"),
            hidePassword: t("hidePassword"),
          }}
        />
      </div>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-[var(--ap-muted)]">
        <span>{t("haveAccount")}</span>
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-medium text-[var(--ap-accent)] hover:underline"
        >
          <IconLogIn className="h-4 w-4 shrink-0 text-[var(--ap-gold-deep)]" />
          {t("signInLink")}
        </Link>
      </p>

      <p className="mt-6 text-center text-xs leading-relaxed text-[var(--ap-muted)]">{t("securityNote")}</p>
    </article>
  );
}
