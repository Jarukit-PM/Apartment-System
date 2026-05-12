import { getTranslations } from "next-intl/server";
import { logoutFormAction } from "@/lib/auth-actions";

export async function LogoutForm({ locale }: { locale: string }) {
  const t = await getTranslations("Auth");

  return (
    <form action={logoutFormAction} className="inline">
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {t("signOut")}
      </button>
    </form>
  );
}
