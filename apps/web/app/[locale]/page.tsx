import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AuthImmersiveShell } from "@/components/auth/auth-immersive-shell";
import { LoginPanel } from "@/components/auth/login-panel";
import { getSessionUser } from "@/lib/auth/session-user";
import { isSafeAppPath } from "@/lib/auth/url-guards";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (user) {
    const next = sp.next && isSafeAppPath(sp.next) ? sp.next : undefined;
    if (next) {
      redirect(next);
    }
    redirect(user.isAdmin ? "/dashboard" : "/my");
  }

  const next = sp.next && isSafeAppPath(sp.next) ? sp.next : undefined;

  return (
    <AuthImmersiveShell>
      <LoginPanel locale={locale} next={next} error={sp.error} />
    </AuthImmersiveShell>
  );
}
