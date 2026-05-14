"use client";

import { NEXT_INTL_LOCALE_COOKIE_NAME } from "@/lib/next-intl-locale-constants";

export function writeNextIntlLocaleCookie(locale: string): void {
  const secure = process.env.NODE_ENV === "production" ? ";Secure" : "";
  document.cookie = `${NEXT_INTL_LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax${secure}`;
}
