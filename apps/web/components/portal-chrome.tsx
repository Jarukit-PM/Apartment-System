import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LogoutForm } from "@/components/logout-form";

const links = [
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/properties", key: "properties" as const },
  { href: "/units", key: "units" as const },
  { href: "/residents", key: "residents" as const },
  { href: "/leases", key: "leases" as const },
  { href: "/maintenance", key: "maintenance" as const },
];

export async function PortalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Portal");
  const locale = await getLocale();

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:w-56 md:border-b-0 md:border-r md:py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("brand")}
          </p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t("console")}</p>
        </div>
        <nav className="flex flex-wrap gap-2 md:flex-col md:gap-1" aria-label={t("navLabel")}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {t(`nav.${l.key}`)}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <Link
            href="/my"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("myPortal")}
          </Link>
          <LogoutForm locale={locale} />
        </div>
        <div className="mt-8 hidden text-xs text-zinc-500 dark:text-zinc-400 md:block">
          {t("hint")}
        </div>
      </aside>
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
