import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** `params` is often missing when this UI is rendered from `notFound()` — do not assume a locale segment. */
type Props = { params?: Promise<{ locale: string }> };

export default async function LocaleNotFound({ params }: Props) {
  const resolved = params !== undefined ? await params : undefined;
  const locale =
    resolved?.locale && hasLocale(routing.locales, resolved.locale)
      ? resolved.locale
      : routing.defaultLocale;

  setRequestLocale(locale);
  const t = await getTranslations("NotFoundPage");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("code")}</p>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
      <p className="mt-2 max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">{t("body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
        <Link
          href="/"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          {t("home")}
        </Link>
        <Link
          href="/dashboard"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          {t("dashboard")}
        </Link>
      </div>
    </div>
  );
}
