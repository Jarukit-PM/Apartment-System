"use client";

import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import { loginGoogleAction } from "@/lib/auth/actions";

type Props = {
  locale: string;
  next?: string;
};

export function GoogleSignIn({ locale, next }: Props) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }
  return (
    <div className="w-full">
      <div className="flex w-full justify-center [&>div]:!w-full">
        <GoogleLogin
          onSuccess={async (credentialResponse: CredentialResponse) => {
            const c = credentialResponse.credential;
            if (!c) return;
            await loginGoogleAction(c, locale, next);
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
