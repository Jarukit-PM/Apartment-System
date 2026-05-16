import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Home, LayoutDashboard, SearchX } from "lucide-react";
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
    <div className="ap-ambient-bg flex flex-1 flex-col items-center justify-center px-6 py-24">
      <span className="ap-icon-tile ap-icon-tile-lg" aria-hidden>
        <SearchX className="h-7 w-7" strokeWidth={1.5} />
      </span>
      <p className="ap-eyebrow mt-6">{t("code")}</p>
      <h1 className="ap-headline mt-2 text-center">{t("title")}</h1>
      <p className="ap-body mt-3 max-w-md text-center">{t("body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="ap-btn ap-btn-primary">
          <Home className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {t("home")}
        </Link>
        <Link href="/dashboard" className="ap-btn ap-btn-secondary">
          <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {t("dashboard")}
        </Link>
      </div>
    </div>
  );
}
