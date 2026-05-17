"use client";

import { SuccessDialog } from "@/components/ui/success-dialog";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/actions/portal";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ActionState = { ok: true, message: "" };

export type ActionFormSuccessLabels = {
  title: string;
  description?: string;
  closeLabel?: string;
};

type Props = {
  action: (prev: ActionState, data: FormData) => Promise<ActionState>;
  locale: string;
  children: ReactNode;
  submitLabel: string;
  success?: ActionFormSuccessLabels;
};

export function ActionForm({ action, locale, children, submitLabel, success }: Props) {
  const [acknowledgedRevision, setAcknowledgedRevision] = useState<number | null>(null);
  const [state, formAction] = useActionState(action, initial);

  const revision = state.saveRevision;
  const showSuccess = Boolean(
    success &&
      state.ok &&
      revision != null &&
      revision !== acknowledgedRevision &&
      !state.createdUnit,
  );

  function dismissSuccess() {
    if (revision != null) setAcknowledgedRevision(revision);
  }

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {children}
        {!state.ok && state.message ? (
          <p className="text-sm text-red-600" role="alert">
            {state.message}
          </p>
        ) : null}
        <SubmitButton label={submitLabel} />
      </form>

      {success ? (
        <SuccessDialog
          open={showSuccess}
          title={success.title}
          description={success.description}
          onClose={dismissSuccess}
          closeAriaLabel={success.closeLabel ?? "Close"}
        />
      ) : null}
    </>
  );
}
