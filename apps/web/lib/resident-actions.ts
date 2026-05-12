"use server";

import { revalidatePath } from "next/cache";
import { apiFetchJsonAuthed } from "@/lib/server-api";
import type { ActionState } from "@/lib/portal-actions";

export async function createMyMaintenanceRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!unitId || !title) {
    return { ok: false, message: "Unit and title are required" };
  }
  const res = await apiFetchJsonAuthed(`/v1/me/maintenance-requests`, {
    method: "POST",
    body: JSON.stringify({ unitId, title, description }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return { ok: false, message: res.error?.message ?? "Could not submit request" };
  }
  revalidatePath(`/${locale}/my/maintenance`, "page");
  revalidatePath(`/${locale}/my`, "page");
  return { ok: true, message: "" };
}
