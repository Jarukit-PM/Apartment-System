"use client";

import { useActionState, useMemo, useState } from "react";
import type { ActionState } from "@/lib/actions/portal";
import {
  MAINTENANCE_CATEGORY_OTHER,
  type MaintenanceCategoryId,
} from "@/lib/domain/maintenance-categories";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ActionState = { ok: true, message: "" };

export type MaintenanceCategoryOption = {
  id: MaintenanceCategoryId;
  label: string;
};

type UnitChoice = { unitId: string; label: string };

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  locale: string;
  submitLabel: string;
  categories: MaintenanceCategoryOption[];
  labels: {
    unit: string;
    pickUnit?: string;
    ticketTitle: string;
    titleOther: string;
    titleOtherPlaceholder: string;
    description: string;
    photos: string;
    photosHint: string;
    requestedBy?: string;
    optional?: string;
    status?: string;
  };
  unitChoices: UnitChoice[];
  residents?: { id: string; fullName: string }[];
  showStatus?: boolean;
  requireUnitPick?: boolean;
};

export function MaintenanceRequestForm({
  action,
  locale,
  submitLabel,
  categories,
  labels,
  unitChoices,
  residents,
  showStatus = false,
  requireUnitPick = false,
}: Props) {
  const [state, formAction] = useActionState(action, initial);
  const [categoryId, setCategoryId] = useState<MaintenanceCategoryId>(categories[0]?.id ?? MAINTENANCE_CATEGORY_OTHER);
  const [customTitle, setCustomTitle] = useState("");

  const resolvedTitle = useMemo(() => {
    if (categoryId === MAINTENANCE_CATEGORY_OTHER) {
      return customTitle.trim();
    }
    return categories.find((c) => c.id === categoryId)?.label ?? "";
  }, [categories, categoryId, customTitle]);

  const isOther = categoryId === MAINTENANCE_CATEGORY_OTHER;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="title" value={resolvedTitle} />

      <div>
        <label htmlFor="maint-unit" className="ap-label">
          {labels.unit}
        </label>
        <select
          id="maint-unit"
          name="unitId"
          required
          className="mt-1 w-full ap-select"
          defaultValue={requireUnitPick ? "" : unitChoices[0]?.unitId}
        >
          {requireUnitPick ? <option value="">{labels.pickUnit}</option> : null}
          {unitChoices.map((u) => (
            <option key={u.unitId} value={u.unitId}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="maint-category" className="ap-label">
          {labels.ticketTitle}
        </label>
        <select
          id="maint-category"
          name="titleCategory"
          required
          className="mt-1 w-full ap-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value as MaintenanceCategoryId)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {isOther ? (
        <div>
          <label htmlFor="maint-title-other" className="ap-label">
            {labels.titleOther}
          </label>
          <input
            id="maint-title-other"
            name="titleCustom"
            required
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={labels.titleOtherPlaceholder}
            className="mt-1 w-full ap-select"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="maint-desc" className="ap-label">
          {labels.description}
        </label>
        <textarea id="maint-desc" name="description" rows={3} className="mt-1 w-full ap-select" />
      </div>

      <div>
        <label htmlFor="maint-photos" className="ap-label">
          {labels.photos}
        </label>
        <input
          id="maint-photos"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="mt-1 block w-full text-sm text-[var(--ap-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ap-gold-deep)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
        />
        <p className="mt-1 text-xs text-[var(--ap-muted)]">{labels.photosHint}</p>
      </div>

      {residents && labels.requestedBy ? (
        <div>
          <label htmlFor="maint-requested-by" className="ap-label">
            {labels.requestedBy}
          </label>
          <select id="maint-requested-by" name="requestedByResidentId" className="mt-1 w-full ap-select">
            <option value="">{labels.optional}</option>
            {residents.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showStatus && labels.status ? (
        <div>
          <label htmlFor="maint-status" className="ap-label">
            {labels.status}
          </label>
          <select id="maint-status" name="status" defaultValue="open" className="mt-1 w-full ap-select">
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="closed">closed</option>
          </select>
        </div>
      ) : null}

      {!state.ok && state.message ? (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
