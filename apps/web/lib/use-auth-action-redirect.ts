"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import type { LoginState } from "@/lib/auth-actions";

/** After password/register server actions set cookies, client navigates so RSC sees `as_access`. */
export function useAuthActionRedirect(state: LoginState) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!state.redirectTo) {
      done.current = false;
      return;
    }
    if (done.current) return;
    done.current = true;
    router.push(state.redirectTo);
    router.refresh();
  }, [state.redirectTo, router]);
}
