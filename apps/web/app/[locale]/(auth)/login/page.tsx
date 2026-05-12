import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginPasswordForm } from "@/components/login-password-form";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const next = sp.next?.startsWith(`/${locale}/`) ? sp.next : undefined;

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("loginTitle")}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("loginSubtitle")}</p>

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
          <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">{t("divider")}</span>
        </div>
      </div>

      <GoogleSignIn locale={locale} caption={t("googleCaption")} next={next} />

      <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("needAccount")}{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
