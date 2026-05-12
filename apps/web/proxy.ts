import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

const adminPrefixes = [
  "/dashboard",
  "/properties",
  "/units",
  "/residents",
  "/leases",
  "/maintenance",
];

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const m = pathname.match(/^\/(en|th)(\/.*)?$/);
  if (!m) {
    return handleI18n(request);
  }
  const locale = m[1];
  const rest = m[2] ?? "";

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

  for (const p of adminPrefixes) {
    if (rest === p || rest.startsWith(`${p}/`)) {
      if (!request.cookies.get("as_access")) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("next", pathname);
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
