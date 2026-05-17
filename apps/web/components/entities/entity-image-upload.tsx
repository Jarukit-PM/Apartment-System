"use client";

import { SuccessDialog } from "@/components/ui/success-dialog";
import type { ActionFormSuccessLabels } from "@/components/ui/action-form";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/actions/portal";

type EntityImageUploadProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  locale: string;
  entityId: string;
  entityField: "propertyId" | "unitId";
  propertyId?: string;
  labels: {
    file: string;
    submit: string;
    remove: string;
    hint: string;
  };
  hasImage: boolean;
  removeAction?: (formData: FormData) => Promise<void>;
  success?: ActionFormSuccessLabels;
};

const initial: ActionState = { ok: true, message: "" };

export function EntityImageUpload({
  action,
  locale,
  entityId,
  entityField,
  propertyId,
  labels,
  hasImage,
  removeAction,
  success,
}: EntityImageUploadProps) {
  const [acknowledgedRevision, setAcknowledgedRevision] = useState<number | null>(null);
  const [state, formAction] = useActionState(action, initial);

  const revision = state.saveRevision;
  const showSuccess = Boolean(
    success && state.ok && revision != null && revision !== acknowledgedRevision,
  );

  function dismissSuccess() {
    if (revision != null) setAcknowledgedRevision(revision);
  }

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name={entityField} value={entityId} />
        {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
        <div>
          <label htmlFor={`${entityField}-image`} className="ap-label">
            {labels.file}
          </label>
          <input
            id={`${entityField}-image`}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 block w-full text-sm text-[var(--ap-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ap-gold-deep)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
          />
          <p className="mt-1 text-xs text-[var(--ap-muted)]">{labels.hint}</p>
        </div>
        <SubmitButton label={labels.submit} />
      </form>
      {hasImage && removeAction ? (
        <form action={removeAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name={entityField} value={entityId} />
          {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
          <SubmitButton label={labels.remove} variant="danger" />
        </form>
      ) : null}
      {!state.ok && state.message ? (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}

      {success ? (
        <SuccessDialog
          open={showSuccess}
          title={success.title}
          description={success.description}
          onClose={dismissSuccess}
          closeAriaLabel={success.closeLabel ?? "Close"}
        />
      ) : null}
    </div>
  );
}
