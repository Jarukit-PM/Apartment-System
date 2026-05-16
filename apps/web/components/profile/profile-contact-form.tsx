"use client";

import { useActionState } from "react";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateMyProfileAction } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/portal";

const initial: ActionState = { ok: true, message: "" };
const savedFlag = "saved";

type Labels = {
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  emailReadOnly: string;
  save: string;
  saved: string;
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
  const [state, formAction] = useActionState(updateMyProfileAction, initial);
  const showSaved = state.ok && state.message === savedFlag;

  return (
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

      {showSaved ? (
        <p className="text-sm font-medium text-[var(--ap-gold-deep)]" role="status" aria-live="polite">
          {labels.saved}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--ap-muted)]">{labels.contactHint}</p>

      <div className="pt-1">
        <SubmitButton label={labels.save} />
      </div>
    </form>
  );
}
