import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/access-token";
import { ADMIN_REST_PREFIXES } from "@/lib/admin-paths";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const m = pathname.match(/^\/(en|th)(\/.*)?$/i);
  if (!m) {
    return handleI18n(request);
  }
  const locale = m[1].toLowerCase();
  const rest = m[2] ?? "";

  // Canonical locale segment (avoids /EN vs /en mismatches with the App Router).
  if (m[1] !== locale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${rest}`;
    return NextResponse.redirect(url);
  }

  // Localized home: /{locale} or /{locale}/ — public, no admin gate.
  if (rest === "" || rest === "/") {
    return handleI18n(request);
  }

  if (rest.startsWith("/login") || rest.startsWith("/register")) {
    return handleI18n(request);
  }

  if (rest.startsWith("/my")) {
    if (!request.cookies.get("as_access")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return handleI18n(request);
  }

  for (const p of ADMIN_REST_PREFIXES) {
    if (rest === p || rest.startsWith(`${p}/`)) {
      const raw = request.cookies.get("as_access")?.value;
      if (!raw) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      const secret = process.env.JWT_SECRET?.trim() ?? "";
      const v = verifyAccessToken(raw, secret);
      if (!v.ok) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("next", pathname);
        const res = NextResponse.redirect(url);
        res.cookies.delete("as_access");
        res.cookies.delete("as_refresh");
        return res;
      }
      if (!v.roles.includes("admin")) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/my`;
        return NextResponse.redirect(url);
      }
      return handleI18n(request);
    }
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
