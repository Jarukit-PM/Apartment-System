"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { ActionState } from "@/lib/actions/portal";
import { apiFetchJsonAuthed } from "@/lib/api/server";

function ok(): ActionState {
  return { ok: true, message: "", saveRevision: Date.now() };
}

function fail(msg: string): ActionState {
  return { ok: false, message: msg };
}

/** `YYYY-MM-DD` from `type="date"` → UTC midnight RFC3339 (calendar day; time ignored by API). */
function dateYmdToUtcMidnightIso(ymd: string): string | null {
  const s = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return `${s}T00:00:00.000Z`;
}

/** Converts `datetime-local` value to RFC3339 UTC string. */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function startToIso(startRaw: string): string | null {
  const t = startRaw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return dateYmdToUtcMidnightIso(t);
  return toIso(t);
}

export async function selfLeaseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "").trim();
  const periodId = String(formData.get("periodId") ?? "").trim();
  const startLocal = String(formData.get("startDate") ?? "").trim();
  const endLocal = String(formData.get("endDate") ?? "").trim();
  if (!unitId || !startLocal) {
    return fail("Unit and start date are required");
  }
  const isoStart = startToIso(startLocal);
  if (!isoStart) return fail("Start date must be valid (use YYYY-MM-DD or datetime-local)");
  const body: Record<string, unknown> = { unitId, startDate: isoStart };
  if (periodId) {
    body.periodId = periodId;
  }
  if (endLocal) {
    const isoEnd =
      /^\d{4}-\d{2}-\d{2}$/.test(endLocal.trim()) ? dateYmdToUtcMidnightIso(endLocal) : toIso(endLocal);
    if (!isoEnd) return fail("End date must be valid");
    body.endDate = isoEnd;
  }
  const res = await apiFetchJsonAuthed(`/v1/me/leases`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const t = await getTranslations({ locale, namespace: "MyPortal.rentBook" });
    if (res.status === 402) {
      return fail(t("bookInsufficientWallet"));
    }
    return fail(res.error?.message ?? "Could not complete booking");
  }
  revalidatePath(`/${locale}/my`, "page");
  revalidatePath(`/${locale}/my/rent`, "page");
  revalidatePath(`/${locale}/my/maintenance`, "page");
  return ok();
}
