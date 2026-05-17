"use client";

import { SuccessDialog } from "@/components/ui/success-dialog";
import { useActionState, useState } from "react";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateMyProfileAction } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/portal";

const initial: ActionState = { ok: true, message: "" };

type Labels = {
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  emailReadOnly: string;
  save: string;
  savedTitle: string;
  savedDescription: string;
  savedClose: string;
  contactHint: string;
};

type Props = {
  locale: string;
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  labels: Labels;
};

export function ProfileContactForm({
  locale,
  fullName,
  email,
  phone,
  memberSince,
  labels,
}: Props) {
  const [acknowledgedRevision, setAcknowledgedRevision] = useState<number | null>(null);
  const [state, formAction] = useActionState(updateMyProfileAction, initial);

  const revision = state.saveRevision;
  const showSuccess = Boolean(
    state.ok && revision != null && revision !== acknowledgedRevision,
  );

  function dismissSuccess() {
    if (revision != null) setAcknowledgedRevision(revision);
  }

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="profile-fullName" className="ap-label">
              {labels.fullName}
            </label>
            <input
              id="profile-fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              defaultValue={fullName}
              className="ap-input mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="profile-email" className="ap-label">
              {labels.email}
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              disabled
              className="ap-input mt-1 cursor-not-allowed opacity-70"
              aria-describedby="profile-email-hint"
            />
            <p id="profile-email-hint" className="mt-1 text-xs text-[var(--ap-muted)]">
              {labels.emailReadOnly}
            </p>
          </div>

          <div>
            <label htmlFor="profile-phone" className="ap-label">
              {labels.phone}
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={phone}
              placeholder="+66 …"
              className="ap-input mt-1"
            />
          </div>

          <div>
            <span className="ap-label">{labels.memberSince}</span>
            <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{memberSince}</p>
          </div>
        </div>

        {!state.ok && state.message ? <AuthFormError message={state.message} /> : null}

        <p className="text-xs leading-relaxed text-[var(--ap-muted)]">{labels.contactHint}</p>

        <div className="pt-1">
          <SubmitButton label={labels.save} />
        </div>
      </form>

      <SuccessDialog
        open={showSuccess}
        title={labels.savedTitle}
        description={labels.savedDescription}
        onClose={dismissSuccess}
        closeAriaLabel={labels.savedClose}
      />
    </>
  );
}
