import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AuthImmersiveShell } from "@/components/auth/auth-immersive-shell";
import { RegisterPanel } from "@/components/auth/register-panel";
import { getSessionUser } from "@/lib/auth/session-user";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (user) {
    redirect(user.isAdmin ? "/dashboard" : "/my");
  }

  return (
    <AuthImmersiveShell>
      <RegisterPanel locale={locale} />
    </AuthImmersiveShell>
  );
}
