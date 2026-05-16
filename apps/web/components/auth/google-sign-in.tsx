"use client";

import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { AuthNavigatingOverlay } from "@/components/auth/auth-navigating-overlay";
import { useRouter } from "@/i18n/navigation";
import { loginGoogleAction } from "@/lib/auth/actions";

type Props = {
  locale: string;
  next?: string;
  navigatingLabel?: string;
};

export function GoogleSignIn({ locale, next, navigatingLabel = "Signing you in" }: Props) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
  <>
      {isNavigating ? <AuthNavigatingOverlay label={navigatingLabel} /> : null}
      <div className="w-full">
        <div className="flex w-full justify-center [&>div]:!w-full">
          <GoogleLogin
            onSuccess={async (credentialResponse: CredentialResponse) => {
              const c = credentialResponse.credential;
              if (!c) return;
              setIsNavigating(true);
              const result = await loginGoogleAction(c, locale, next);
              if ("redirectTo" in result) {
                router.replace(result.redirectTo);
                return;
              }
              setIsNavigating(false);
              router.replace("/?error=google");
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
    </>
  );
}
