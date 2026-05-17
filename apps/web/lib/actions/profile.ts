"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { ActionState } from "@/lib/actions/portal";
import { apiFetchJsonAuthed } from "@/lib/api/server";
import type { Resident, SingleWrapper } from "@/lib/api/types";

function fail(msg: string): ActionState {
  return { ok: false, message: msg };
}

export async function updateMyProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const t = await getTranslations({ locale, namespace: "ProfilePage" });
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) {
    return fail(t("fullNameRequired"));
  }

  const res = await apiFetchJsonAuthed<SingleWrapper<Resident>>("/v1/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, phone }),
  });

  if (!res.ok) {
    return fail(res.error?.message ?? t("saveError"));
  }

  revalidatePath(`/${locale}/my/profile`, "page");
  revalidatePath(`/${locale}/my`, "page");
  revalidatePath(`/${locale}/my`, "layout");

  return { ok: true, message: "", saveRevision: Date.now() };
}
