import {
  MAINTENANCE_CATEGORY_IDS,
  type MaintenanceCategoryId,
} from "@/lib/domain/maintenance-categories";
import type { MaintenanceCategoryOption } from "@/components/maintenance/maintenance-request-form";

type Translator = (key: string) => string;

/** Builds dropdown options from `MaintenanceCategories.*` message keys. */
export function maintenanceCategoryOptions(t: Translator): MaintenanceCategoryOption[] {
  return MAINTENANCE_CATEGORY_IDS.map((id) => ({
    id: id as MaintenanceCategoryId,
    label: t(id),
  }));
}
