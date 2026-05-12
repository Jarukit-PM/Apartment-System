import { apiBaseUrl } from "@/lib/api";
import type { ApiErrorBody } from "@/lib/types";

export type FetchOutcome<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: ApiErrorBody["error"] | null; raw: string };

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiFetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<FetchOutcome<T>> {
  const url = `${apiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
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
