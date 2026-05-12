"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/portal-actions";
import { apiFetchJsonAuthed } from "@/lib/server-api";

function ok(): ActionState {
  return { ok: true, message: "" };
}

function fail(msg: string): ActionState {
  return { ok: false, message: msg };
}

/** Converts `datetime-local` value to RFC3339 UTC string. */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function selfLeaseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "").trim();
  const startLocal = String(formData.get("startDate") ?? "").trim();
  const endLocal = String(formData.get("endDate") ?? "").trim();
  if (!unitId || !startLocal) {
    return fail("Unit and start date are required");
  }
  const isoStart = toIso(startLocal);
  if (!isoStart) return fail("Start date must be a valid date and time");
  const body: Record<string, unknown> = { unitId, startDate: isoStart };
  if (endLocal) {
    const isoEnd = toIso(endLocal);
    if (!isoEnd) return fail("End date must be a valid date and time");
    body.endDate = isoEnd;
  }
  const res = await apiFetchJsonAuthed(`/v1/me/leases`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return fail(res.error?.message ?? "Could not complete booking");
  }
  revalidatePath(`/${locale}/my`, "page");
  revalidatePath(`/${locale}/my/rent`, "page");
  revalidatePath(`/${locale}/my/maintenance`, "page");
  return ok();
}
