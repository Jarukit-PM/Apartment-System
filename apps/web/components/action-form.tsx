"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/portal-actions";
import { SubmitButton } from "@/components/submit-button";

const initial: ActionState = { ok: true, message: "" };

type Props = {
  action: (prev: ActionState, data: FormData) => Promise<ActionState>;
  locale: string;
  children: ReactNode;
  submitLabel: string;
};

export function ActionForm({ action, locale, children, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {children}
      {!state.ok && state.message ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
