"use client";

import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "@/i18n/navigation";
import { loginGoogleAction } from "@/lib/auth-actions";

type Props = {
  locale: string;
  /** Shown above the Google button (e.g. translated “or continue with”). */
  caption?: string;
  next?: string;
};

export function GoogleSignIn({ locale, caption, next }: Props) {
  const router = useRouter();
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }
  return (
    <div className="w-full space-y-2">
      {caption ? <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{caption}</p> : null}
      <div className="flex w-full justify-center [&>div]:!w-full">
        <GoogleLogin
          onSuccess={async (credentialResponse: CredentialResponse) => {
            const c = credentialResponse.credential;
            if (!c) return;
            const result = await loginGoogleAction(c, locale, next);
            if (result.redirectTo) {
              router.push(result.redirectTo);
              router.refresh();
            }
          }}
          onError={() => undefined}
          useOneTap={false}
          text="continue_with"
          shape="rectangular"
          width="384"
          locale={locale === "th" ? "th" : "en"}
        />
      </div>
    </div>
  );
}
