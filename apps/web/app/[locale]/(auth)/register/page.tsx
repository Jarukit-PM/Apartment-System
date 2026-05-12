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
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("registerTitle")}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("registerSubtitle")}</p>

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

      <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
