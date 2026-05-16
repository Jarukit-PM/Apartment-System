/** Stable ids for maintenance title dropdown (labels come from i18n). */
export const MAINTENANCE_CATEGORY_OTHER = "other";

export const MAINTENANCE_CATEGORY_IDS = [
  "plumbing",
  "electrical",
  "air_conditioning",
  "water_heater",
  "appliances",
  "doors_locks",
  "windows",
  "pest",
  "water_damage",
  "furniture",
  "internet",
  "common_area",
  "safety",
  MAINTENANCE_CATEGORY_OTHER,
] as const;

export type MaintenanceCategoryId = (typeof MAINTENANCE_CATEGORY_IDS)[number];

export const MAX_MAINTENANCE_IMAGES = 20;
