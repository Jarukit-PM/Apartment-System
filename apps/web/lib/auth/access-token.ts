import { createHmac, timingSafeEqual } from "node:crypto";

const expectedIssuer = "apartment-system-api";

export type AccessTokenVerifyResult =
  | { ok: true; roles: string[]; email: string; subject: string; residentId?: string }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Verifies HS256 access JWT (same algorithm/claims as `services/api/internal/jwtx`).
 */
export function verifyAccessToken(token: string, secret: string): AccessTokenVerifyResult {
  if (secret.length < 16) return { ok: false, reason: "invalid" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid" };
  const [h, p, sig] = parts;
  if (!h || !p || !sig) return { ok: false, reason: "invalid" };
  const data = `${h}.${p}`;
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, "base64url");
  } catch {
    return { ok: false, reason: "invalid" };
  }
  const mac = createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(data)
    .digest();
  if (sigBuf.length !== mac.length || !timingSafeEqual(sigBuf, mac)) {
    return { ok: false, reason: "invalid" };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!payload || typeof payload !== "object") return { ok: false, reason: "invalid" };
  const o = payload as Record<string, unknown>;
  if (o.iss !== expectedIssuer) return { ok: false, reason: "invalid" };
  const exp = o.exp;
  if (typeof exp !== "number") return { ok: false, reason: "invalid" };
  if (exp * 1000 <= Date.now()) return { ok: false, reason: "expired" };
  const roles = o.roles;
  if (!Array.isArray(roles)) return { ok: false, reason: "invalid" };
  const out = roles.filter((r): r is string => typeof r === "string");
  const email = typeof o.email === "string" ? o.email : "";
  const subject = typeof o.sub === "string" ? o.sub : "";
  const residentId = typeof o.rid === "string" && o.rid ? o.rid : undefined;
  return { ok: true, roles: out, email, subject, residentId };
}
