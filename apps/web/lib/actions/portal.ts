"use server";

import { revalidatePath } from "next/cache";
import { parseRentalPeriodOffersFromForm } from "@/lib/domain/rental-periods";
import { apiFetchJsonAuthed, apiUploadMediaAuthed } from "@/lib/api/server";
import { uploadMaintenanceImagesFromForm } from "@/lib/maintenance/upload-images";

export type CreatedUnitRef = { id: string; label: string };

export type ActionState = {
  ok: boolean;
  message: string;
  createdUnit?: CreatedUnitRef;
};

const ok = (createdUnit?: CreatedUnitRef): ActionState => ({
  ok: true,
  message: "",
  ...(createdUnit ? { createdUnit } : {}),
});

function fail(msg: string): ActionState {
  return { ok: false, message: msg };
}

function apiUserMessage(msg: string, fallback: string): string {
  let m = msg.trim() || fallback;
  if (/unknown field/i.test(m)) {
    m +=
      " If you updated only the web app, redeploy the Go API (it must include `rentalPeriodOffers` on PATCH /v1/units).";
  }
  if (/empty request body/i.test(m)) {
    m += " The API received no JSON body—check proxies or try saving again.";
  }
  return m;
}

export async function createProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("Name is required");
  const res = await apiFetchJsonAuthed(`/v1/properties`, {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not create property");
  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok();
}

function addressFromForm(formData: FormData) {
  const line1 = String(formData.get("addressLine1") ?? "").trim();
  const line2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("addressCity") ?? "").trim();
  const region = String(formData.get("addressRegion") ?? "").trim();
  const postalCode = String(formData.get("addressPostalCode") ?? "").trim();
  const country = String(formData.get("addressCountry") ?? "").trim();
  if (!line1 && !line2 && !city && !region && !postalCode && !country) return undefined;
  return {
    ...(line1 ? { line1 } : {}),
    ...(line2 ? { line2 } : {}),
    ...(city ? { city } : {}),
    ...(region ? { region } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(country ? { country } : {}),
  };
}

export async function updateProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return fail("Property is required");
  if (!name) return fail("Name is required");

  const body: Record<string, unknown> = { name };
  const address = addressFromForm(formData);
  if (address !== undefined) {
    body.address = address;
  }

  const res = await apiFetchJsonAuthed(`/v1/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not update property");

  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/properties/${id}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok();
}

async function uploadImageFromForm(formData: FormData): Promise<string | ActionState> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image file");
  }
  const res = await apiUploadMediaAuthed(file, file.name || "upload.jpg");
  if (!res.ok) {
    return fail(res.error?.message ?? "Could not upload image");
  }
  return res.data.data.url;
}

export async function uploadPropertyImage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return fail("Property is required");

  const uploaded = await uploadImageFromForm(formData);
  if (typeof uploaded !== "string") return uploaded;

  const res = await apiFetchJsonAuthed(`/v1/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ imageUrl: uploaded }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not save property image");

  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/properties/${id}`, "page");
  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok();
}

export async function removePropertyImage(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return;
  await apiFetchJsonAuthed(`/v1/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ imageUrl: "" }),
    headers: { "Content-Type": "application/json" },
  });
  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/properties/${id}`, "page");
  revalidatePath(`/${locale}/units`, "page");
}

export async function uploadUnitImage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!unitId) return fail("Unit is required");

  const uploaded = await uploadImageFromForm(formData);
  if (typeof uploaded !== "string") return uploaded;

  const res = await apiFetchJsonAuthed(`/v1/units/${unitId}`, {
    method: "PATCH",
    body: JSON.stringify({ imageUrl: uploaded }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not save unit image");

  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/units/${unitId}`, "page");
  if (propertyId) {
    revalidatePath(`/${locale}/properties/${propertyId}`, "page");
  }
  return ok();
}

export async function removeUnitImage(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!unitId) return;
  await apiFetchJsonAuthed(`/v1/units/${unitId}`, {
    method: "PATCH",
    body: JSON.stringify({ imageUrl: "" }),
    headers: { "Content-Type": "application/json" },
  });
  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/units/${unitId}`, "page");
  if (propertyId) {
    revalidatePath(`/${locale}/properties/${propertyId}`, "page");
  }
}

export async function deleteProperty(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetchJsonAuthed(`/v1/properties/${id}`, { method: "DELETE" });
  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}

export async function createUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const propertyId = String(formData.get("propertyId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const status = String(formData.get("status") ?? "vacant");
  const floorRaw = formData.get("floor");
  const bedRaw = formData.get("bedrooms");
  const floor =
    floorRaw != null && String(floorRaw) !== "" ? Number(floorRaw) : undefined;
  const bedrooms =
    bedRaw != null && String(bedRaw) !== "" ? Number(bedRaw) : undefined;
  if (!propertyId || !label) return fail("Property and label are required");
  const body: Record<string, unknown> = { propertyId, label, status };
  if (floor !== undefined && !Number.isNaN(floor)) body.floor = floor;
  if (bedrooms !== undefined && !Number.isNaN(bedrooms)) body.bedrooms = bedrooms;
  const listAmtRaw = String(formData.get("listingAmount") ?? "").trim();
  if (listAmtRaw) {
    const amt = Number(listAmtRaw);
    if (!Number.isNaN(amt) && amt > 0) {
      const cur = String(formData.get("listingCurrency") ?? "THB").trim() || "THB";
      body.listingRent = { amount: amt, currency: cur };
    }
  }
  const parsed = parseRentalPeriodOffersFromForm(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const offers = parsed.offers;
  if (offers.length > 0) {
    body.rentalPeriodOffers = offers;
  }
  if (body.listingRent != null || offers.length > 0) {
    body.selfServiceEnabled = formData.get("selfService") === "on";
  }
  const res = await apiFetchJsonAuthed<{ data: { id: string; label: string } }>(`/v1/units`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(apiUserMessage(res.error?.message ?? "", "Could not create unit"));
  const created = res.data.data;
  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/properties/${propertyId}`, "page");
  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/units/new`, "page");
  revalidatePath(`/${locale}/units/${created.id}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok({ id: created.id, label: created.label });
}

export async function patchUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!unitId) return fail("Unit is required");
  const body: Record<string, unknown> = {};
  const listAmtRaw = String(formData.get("listingAmount") ?? "").trim();
  if (listAmtRaw) {
    const amt = Number(listAmtRaw);
    if (!Number.isNaN(amt) && amt > 0) {
      const cur = String(formData.get("listingCurrency") ?? "THB").trim() || "THB";
      body.listingRent = { amount: amt, currency: cur };
    }
  }
  if (formData.get("selfServiceUpdate") === "1") {
    body.selfServiceEnabled = formData.get("selfService") === "on";
  }
  if (formData.get("periodOffersUpdate") === "1") {
    const parsed = parseRentalPeriodOffersFromForm(formData);
    if (!parsed.ok) {
      return fail(parsed.error);
    }
    body.rentalPeriodOffers = parsed.offers;
  }
  if (Object.keys(body).length === 0) {
    return fail("Nothing to update");
  }
  const res = await apiFetchJsonAuthed(`/v1/units/${unitId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(apiUserMessage(res.error?.message ?? "", "Could not update unit"));
  revalidatePath(`/${locale}/properties`, "page");
  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  if (propertyId) {
    revalidatePath(`/${locale}/properties/${propertyId}`, "page");
  }
  revalidatePath(`/${locale}/units/${unitId}`, "page");
  return ok();
}

export async function createResident(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const primary = String(formData.get("primaryUnitId") ?? "").trim();
  if (!fullName || !email) return fail("Name and email are required");
  const body: Record<string, unknown> = { fullName, email, phone };
  if (primary) body.primaryUnitId = primary;
  const res = await apiFetchJsonAuthed(`/v1/residents`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not create resident");
  revalidatePath(`/${locale}/residents`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok();
}

export async function createLease(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "");
  const residentIdsRaw = String(formData.get("residentIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const amount = Number(formData.get("rentAmount") ?? 0);
  const currency = String(formData.get("rentCurrency") ?? "THB").trim() || "THB";
  if (!unitId || residentIdsRaw.length === 0 || !startDate) {
    return fail("Unit, residents, and start date are required");
  }
  const isoStart = toIso(startDate);
  if (!isoStart) return fail("Start date must be datetime-local");
  const body: Record<string, unknown> = {
    unitId,
    residentIds: residentIdsRaw,
    startDate: isoStart,
    status,
    rent: { amount, currency },
  };
  if (endDate) {
    const isoEnd = toIso(endDate);
    if (isoEnd) body.endDate = isoEnd;
  }
  const res = await apiFetchJsonAuthed(`/v1/leases`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not create lease");
  revalidatePath(`/${locale}/leases`, "page");
  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok();
}

export async function updateLeaseStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await apiFetchJsonAuthed(`/v1/leases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    headers: { "Content-Type": "application/json" },
  });
  revalidatePath(`/${locale}/leases`, "page");
  revalidatePath(`/${locale}/units`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}

export async function createMaintenance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const unitId = String(formData.get("unitId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "open");
  const by = String(formData.get("requestedByResidentId") ?? "").trim();
  if (!unitId || !title) return fail("Unit and title are required");
  const uploaded = await uploadMaintenanceImagesFromForm(formData, apiUploadMediaAuthed);
  if (!Array.isArray(uploaded)) return uploaded;
  const body: Record<string, unknown> = { unitId, title, description, status };
  if (by) body.requestedByResidentId = by;
  if (uploaded.length > 0) body.imageUrls = uploaded;
  const res = await apiFetchJsonAuthed(`/v1/maintenance-requests`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return fail(res.error?.message ?? "Could not create request");
  revalidatePath(`/${locale}/maintenance`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return ok();
}

export async function updateMaintenanceStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await apiFetchJsonAuthed(`/v1/maintenance-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    headers: { "Content-Type": "application/json" },
  });
  revalidatePath(`/${locale}/maintenance`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}

/** Converts `datetime-local` value to RFC3339 UTC string. */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
