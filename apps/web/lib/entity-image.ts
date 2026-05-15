import { apiBaseUrl } from "@/lib/api";

export const FALLBACK_PROPERTY_IMAGE = "/images/fallback-property.svg";
export const FALLBACK_UNIT_IMAGE = "/images/fallback-unit.svg";

/** Turns API-relative `/media/...` paths into absolute URLs for `<img src>`. */
export function mediaAbsoluteUrl(path?: string | null): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = apiBaseUrl().replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function resolvePropertyImageSrc(imageUrl?: string | null): string {
  return mediaAbsoluteUrl(imageUrl) ?? FALLBACK_PROPERTY_IMAGE;
}

/** Unit image, then parent property image, then unit placeholder. */
export function resolveUnitImageSrc(
  unitImageUrl?: string | null,
  propertyImageUrl?: string | null,
): string {
  return (
    mediaAbsoluteUrl(unitImageUrl) ??
    mediaAbsoluteUrl(propertyImageUrl) ??
    FALLBACK_UNIT_IMAGE
  );
}
