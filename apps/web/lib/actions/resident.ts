"use server";

import { revalidatePath } from "next/cache";
import { apiFetchJsonAuthed, apiUploadMediaMeAuthed } from "@/lib/api/server";
import type { ActionState } from "@/lib/actions/portal";
import { uploadMaintenanceImagesFromForm } from "@/lib/maintenance/upload-images";

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
  const uploaded = await uploadMaintenanceImagesFromForm(formData, apiUploadMediaMeAuthed);
  if (!Array.isArray(uploaded)) {
    return uploaded;
  }
  const res = await apiFetchJsonAuthed(`/v1/me/maintenance-requests`, {
    method: "POST",
    body: JSON.stringify({
      unitId,
      title,
      description,
      ...(uploaded.length > 0 ? { imageUrls: uploaded } : {}),
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return { ok: false, message: res.error?.message ?? "Could not submit request" };
  }
  revalidatePath(`/${locale}/my/maintenance`, "page");
  revalidatePath(`/${locale}/my`, "page");
  return { ok: true, message: "" };
}
