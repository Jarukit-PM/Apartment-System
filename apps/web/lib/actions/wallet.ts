"use server";

import { revalidatePath } from "next/cache";
import { apiFetchJsonAuthed } from "@/lib/api/server";
import type { ActionState } from "@/lib/actions/portal";

function fail(msg: string): ActionState {
  return { ok: false, message: msg };
}

function ok(): ActionState {
  return { ok: true, message: "" };
}

/** Parses a decimal baht string into integer satang (0.01 THB). */
function parseBahtToSatang(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [a, b = ""] = s.split(".");
  const frac = (b + "00").slice(0, 2);
  const w = Number(a);
  const f = Number(frac);
  if (!Number.isFinite(w) || !Number.isFinite(f)) return null;
  const satang = w * 100 + f;
  if (satang <= 0 || satang > Number.MAX_SAFE_INTEGER) return null;
  return Math.round(satang);
}

export async function walletTopUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const amountRaw = String(formData.get("amountBaht") ?? "");
  const satang = parseBahtToSatang(amountRaw);
  if (satang == null) {
    return fail("Enter a positive amount in THB (up to 2 decimal places).");
  }
  const res = await apiFetchJsonAuthed(`/v1/wallet/top-ups`, {
    method: "POST",
    body: JSON.stringify({ amountSatang: satang }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return fail(res.error?.message ?? "Top-up failed");
  }
  revalidatePath(`/${locale}/my/wallet`, "page");
  revalidatePath(`/${locale}/wallet`, "page");
  return ok();
}

export async function walletTransfer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const toUserId = String(formData.get("toUserId") ?? "").trim();
  const amountRaw = String(formData.get("amountBaht") ?? "");
  if (!toUserId) {
    return fail("Recipient user id is required.");
  }
  const satang = parseBahtToSatang(amountRaw);
  if (satang == null) {
    return fail("Enter a positive amount in THB (up to 2 decimal places).");
  }
  const res = await apiFetchJsonAuthed(`/v1/wallet/transfers`, {
    method: "POST",
    body: JSON.stringify({ toUserId, amountSatang: satang }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return fail(res.error?.message ?? "Transfer failed");
  }
  revalidatePath(`/${locale}/my/wallet`, "page");
  revalidatePath(`/${locale}/wallet`, "page");
  return ok();
}
