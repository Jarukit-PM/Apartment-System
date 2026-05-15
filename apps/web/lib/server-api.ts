import { cookies, headers } from "next/headers";
import { apiBaseUrl } from "@/lib/api";
import type { ApiErrorBody } from "@/lib/types";

export type FetchOutcome<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: ApiErrorBody["error"] | null; raw: string };

/** Fallback when `cookies().get` is empty but the browser sent `Cookie` (edge cases after Server Actions). */
function asAccessFromCookieHeader(raw: string | null): string | undefined {
  if (!raw) return undefined;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    if (name !== "as_access") continue;
    let v = part.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return undefined;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** `fetch` init.headers may be a `Headers` instance; object-spread drops entries. */
function mergeFetchHeaders(init: RequestInit | undefined, defaults: Record<string, string>): Headers {
  const out = new Headers();
  for (const [k, v] of Object.entries(defaults)) {
    out.set(k, v);
  }
  if (init?.headers) {
    const incoming = new Headers(init.headers as HeadersInit);
    incoming.forEach((value, key) => {
      out.set(key, value);
    });
  }
  return out;
}

export async function apiFetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<FetchOutcome<T>> {
  const url = `${apiBaseUrl()}${path}`;
  const headers = mergeFetchHeaders(init, { Accept: "application/json" });
  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  const body = await parseBody(res);
  if (!res.ok) {
    const err =
      body && typeof body === "object" && body !== null && "error" in body
        ? (body as ApiErrorBody).error
        : null;
    return { ok: false, status: res.status, error: err, raw: JSON.stringify(body) };
  }
  return { ok: true, data: body as T, status: res.status };
}

export async function apiGetJson<T>(path: string): Promise<FetchOutcome<T>> {
  return apiFetchJson<T>(path, { method: "GET" });
}

/** Merges Bearer token from httpOnly cookie (set by auth routes). */
export async function apiFetchJsonAuthed<T>(
  path: string,
  init?: RequestInit,
): Promise<FetchOutcome<T>> {
  let tok = (await cookies()).get("as_access")?.value;
  if (!tok) {
    tok = asAccessFromCookieHeader((await headers()).get("cookie"));
  }
  const headersInit = new Headers(init?.headers);
  if (tok) {
    headersInit.set("Authorization", `Bearer ${tok}`);
  }
  return apiFetchJson<T>(path, { ...init, headers: headersInit });
}

export async function apiGetJsonAuthed<T>(path: string): Promise<FetchOutcome<T>> {
  return apiFetchJsonAuthed<T>(path, { method: "GET" });
}

type MediaUploadResponse = { data: { url: string } };

/** Uploads an image file to POST /v1/media (admin). Do not set Content-Type; boundary is automatic. */
export async function apiUploadMediaAuthed(file: Blob, filename: string): Promise<FetchOutcome<MediaUploadResponse>> {
  const fd = new FormData();
  fd.append("file", file, filename);
  return apiFetchJsonAuthed<MediaUploadResponse>("/v1/media", { method: "POST", body: fd });
}
