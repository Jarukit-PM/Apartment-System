import { getTranslations } from "next-intl/server";
import { AuthImmersiveShell } from "@/components/auth/auth-immersive-shell";
import { SiteHeader } from "@/components/layout/site-header";

type Props = {
  variant: "login" | "register";
  children: React.ReactNode;
};

export async function AuthPageShell({ variant, children }: Props) {
  const [t, tHome] = await Promise.all([getTranslations("Auth"), getTranslations("HomePage")]);

  return (
    <AuthImmersiveShell
      header={
        <SiteHeader
          variant={variant}
          brand={tHome("brand")}
          languageLabel={t("language")}
          signInLabel={t("signIn")}
          registerLabel={t("registerLink")}
        />
      }
    >
      {children}
    </AuthImmersiveShell>
  );
}
