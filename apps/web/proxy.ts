import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/access-token";
import { ADMIN_REST_PREFIXES } from "@/lib/admin-paths";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

const LEGACY_LOCALE_PREFIX = /^\/(en|th)(\/.*)?$/i;

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /** Old bookmarks `/en/...` → unprefixed path + `NEXT_LOCALE` cookie. */
  const legacy = pathname.match(LEGACY_LOCALE_PREFIX);
  if (legacy) {
    const loc = legacy[1].toLowerCase();
    const rest = legacy[2] ?? "";
    const url = request.nextUrl.clone();
    url.pathname = rest === "" || rest === "/" ? "/" : rest;
    const res = NextResponse.redirect(url);
    if (routing.locales.includes(loc as (typeof routing.locales)[number])) {
      res.cookies.set("NEXT_LOCALE", loc, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  }

  if (pathname === "/" || pathname === "") {
    return handleI18n(request);
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return handleI18n(request);
  }

  if (pathname === "/my" || pathname.startsWith("/my/")) {
    if (!request.cookies.get("as_access")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return handleI18n(request);
  }

  for (const p of ADMIN_REST_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      const raw = request.cookies.get("as_access")?.value;
      if (!raw) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      const secret = process.env.JWT_SECRET?.trim() ?? "";
      const v = verifyAccessToken(raw, secret);
      if (!v.ok) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        const res = NextResponse.redirect(url);
        res.cookies.delete("as_access");
        res.cookies.delete("as_refresh");
        return res;
      }
      if (!v.roles.includes("admin")) {
        const url = request.nextUrl.clone();
        url.pathname = "/my";
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
