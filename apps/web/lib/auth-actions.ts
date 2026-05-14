"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiBaseUrl } from "@/lib/api";
import { isAdminPortalPath } from "@/lib/admin-paths";
import { isSafeAppPath } from "@/lib/url-guards";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

import { NEXT_INTL_LOCALE_COOKIE_NAME } from "@/lib/next-intl-locale-constants";

async function applyTokenCookies(data: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  const jar = await cookies();
  jar.set("as_access", data.accessToken, {
    ...cookieBase,
    maxAge: Math.max(60, Number(data.expiresIn) || 900),
  });
  jar.set("as_refresh", data.refreshToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function setUiLocaleCookie(locale: string) {
  const jar = await cookies();
  jar.set(NEXT_INTL_LOCALE_COOKIE_NAME, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
}

export type LoginState = { ok: boolean; message: string };

/** `next` is a locale-free app path (e.g. `/properties/1`). */
function postAuthPath(next: string, roles: string[]): string {
  const n = next.trim();
  if (!n || !isSafeAppPath(n)) {
    return roles.includes("admin") ? "/dashboard" : "/my";
  }
  const pathOnly = n.split("?")[0] ?? "/";
  if (!isSafeAppPath(pathOnly)) {
    return roles.includes("admin") ? "/dashboard" : "/my";
  }
  if (pathOnly.startsWith("/login") || pathOnly.startsWith("/register")) {
    return roles.includes("admin") ? "/dashboard" : "/my";
  }
  if (isAdminPortalPath(pathOnly) && !roles.includes("admin")) {
    return "/my";
  }
  return pathOnly;
}

export async function loginPasswordAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = String(formData.get("locale") ?? "en");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();
  if (!email || !password) {
    return { ok: false, message: "Email and password are required" };
  }
  const res = await fetch(`${apiBaseUrl()}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { accessToken: string; refreshToken: string; expiresIn: number; user?: { roles?: string[] } };
    error?: { message?: string };
  } | null;
  if (!res.ok || !body?.data) {
    return { ok: false, message: body?.error?.message ?? "Login failed" };
  }
  await applyTokenCookies(body.data);
  const roles = body.data.user?.roles ?? [];
  const destPath = postAuthPath(next, roles);
  await setUiLocaleCookie(locale);
  revalidatePath(`/${locale}${destPath}`);
  redirect(destPath);
}

export async function registerResidentAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = String(formData.get("locale") ?? "en");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!email || !password || !fullName) {
    return { ok: false, message: "Email, password, and name are required" };
  }
  const res = await fetch(`${apiBaseUrl()}/v1/auth/register-resident`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName, phone }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { accessToken: string; refreshToken: string; expiresIn: number };
    error?: { message?: string };
  } | null;
  if (!res.ok || !body?.data) {
    return { ok: false, message: body?.error?.message ?? "Registration failed" };
  }
  await applyTokenCookies(body.data);
  await setUiLocaleCookie(locale);
  revalidatePath(`/${locale}/my`);
  redirect("/my");
}

export async function loginGoogleAction(idToken: string, locale: string, next?: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/v1/auth/oauth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { accessToken: string; refreshToken: string; expiresIn: number; user?: { roles?: string[] } };
    error?: { message?: string };
  } | null;
  if (!res.ok || !body?.data) {
    redirect("/login?error=google");
  }
  await applyTokenCookies(body.data);
  const roles = body.data.user?.roles ?? [];
  const destPath = postAuthPath(next ?? "", roles);
  await setUiLocaleCookie(locale);
  revalidatePath(`/${locale}${destPath}`);
  redirect(destPath);
}

export async function logoutFormAction(formData: FormData): Promise<never> {
  const locale = String(formData.get("locale") ?? "en");
  const jar = await cookies();
  const rt = jar.get("as_refresh")?.value;
  if (rt) {
    await fetch(`${apiBaseUrl()}/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  jar.delete("as_access");
  jar.delete("as_refresh");
  revalidatePath(`/${locale}/my`);
  revalidatePath(`/${locale}/dashboard`);
  redirect("/login");
}
