import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/access-token";

/** Roles from the httpOnly access JWT (server-only). Null if missing/invalid. */
export async function getAccessTokenRoles(): Promise<string[] | null> {
  const jar = await cookies();
  const raw = jar.get("as_access")?.value;
  if (!raw) return null;
  const secret = process.env.JWT_SECRET?.trim() ?? "";
  const v = verifyAccessToken(raw, secret);
  return v.ok ? v.roles : null;
}
