import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** Bare `/` has no `[locale]` segment; send users to the default locale home. */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
