import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/access-token";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { MeSummaryData, SingleWrapper } from "@/lib/api/types";

export type SessionUser = {
  email: string;
  displayName: string;
  roles: string[];
  isAdmin: boolean;
  isResident: boolean;
  residentId?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get("as_access")?.value;
  if (!raw) return null;
  const secret = process.env.JWT_SECRET?.trim() ?? "";
  const v = verifyAccessToken(raw, secret);
  if (!v.ok) return null;

  const isAdmin = v.roles.includes("admin");
  const isResident = v.roles.includes("resident");
  const email = v.email || "user@apartment.local";
  const displayName = email.includes("@") ? email.split("@")[0]! : email;

  return {
    email,
    displayName,
    roles: v.roles,
    isAdmin,
    isResident,
    residentId: v.residentId,
  };
}

/** Prefer resident full name from API when available. */
export async function enrichSessionUser(user: SessionUser): Promise<SessionUser> {
  if (!user.residentId) return user;
  const res = await apiGetJsonAuthed<SingleWrapper<MeSummaryData>>("/v1/me/summary");
  if (!res.ok) return user;
  return {
    ...user,
    displayName: res.data.data.resident.fullName || user.displayName,
  };
}
