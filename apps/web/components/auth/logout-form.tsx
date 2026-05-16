import { getTranslations } from "next-intl/server";
import { logoutFormAction } from "@/lib/auth/actions";

type Props = {
  locale: string;
  variant?: "default" | "sidebar";
};

export async function LogoutForm({ locale, variant = "default" }: Props) {
  const t = await getTranslations("Auth");

  const buttonClass =
    variant === "sidebar"
      ? "ap-btn ap-btn-secondary w-full !rounded-[0.75rem] !py-2.5 text-sm"
      : "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

  return (
    <form action={logoutFormAction} className={variant === "sidebar" ? "w-full" : "inline"}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={buttonClass}>
        {t("signOut")}
      </button>
    </form>
  );
}
