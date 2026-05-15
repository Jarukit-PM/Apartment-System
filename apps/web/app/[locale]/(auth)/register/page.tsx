import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RegisterResidentForm } from "@/components/register-resident-form";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <article className="ap-glass-elevated mx-auto w-full max-w-md rounded-[var(--ap-radius-lg)] p-8 md:p-10">
      <h1 className="ap-headline text-xl">{t("registerTitle")}</h1>
      <p className="ap-body mt-2 text-sm">{t("registerSubtitle")}</p>

      <div className="mt-8">
        <RegisterResidentForm
          locale={locale}
          labels={{
            fullName: t("fullName"),
            email: t("email"),
            phone: t("phoneOptional"),
            password: t("password"),
            submit: t("createAccount"),
          }}
        />
      </div>

      <p className="mt-8 text-center text-sm text-[var(--ap-muted)]">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-[var(--ap-accent)] hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </article>
  );
}
