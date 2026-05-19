"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { AuthNavigatingOverlay } from "@/components/auth/auth-navigating-overlay";
import { IconLogIn, IconMail } from "@/components/auth/auth-icons";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginPasswordAction, type LoginState } from "@/lib/auth/actions";

const initial: LoginState = { ok: true, message: "" };

type Props = {
  locale: string;
  next?: string;
  formLabel: string;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  navigatingLabel?: string;
};

type FieldsProps = Omit<Props, "locale" | "next" | "formLabel"> & {
  locale: string;
  next?: string;
  state: LoginState;
  navigatingLabel: string;
};

function LoginFormFields({
  locale,
  next,
  state,
  emailLabel,
  passwordLabel,
  submitLabel,
  showPasswordLabel,
  hidePasswordLabel,
  navigatingLabel,
}: FieldsProps) {
  const { pending } = useFormStatus();
  const showOverlay = pending;

  return (
    <>
      {showOverlay ? <AuthNavigatingOverlay label={navigatingLabel} /> : null}
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label htmlFor="login-email" className="ap-label">
          {emailLabel}
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ap-muted)]">
            <IconMail />
          </span>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            className="ap-input !pl-10"
          />
        </div>
      </div>

      <PasswordInput
        id="login-password"
        name="password"
        label={passwordLabel}
        autoComplete="current-password"
        showPasswordLabel={showPasswordLabel}
        hidePasswordLabel={hidePasswordLabel}
      />

      {!state.ok && state.message ? <AuthFormError message={state.message} /> : null}

      <div className="pt-1 [&_button]:w-full [&_button]:gap-2">
        <SubmitButton label={submitLabel} icon={<IconLogIn />} />
      </div>
    </>
  );
}

export function LoginPasswordForm({
  locale,
  next,
  formLabel,
  emailLabel,
  passwordLabel,
  submitLabel,
  showPasswordLabel,
  hidePasswordLabel,
  navigatingLabel = "Signing you in",
}: Props) {
  const [state, formAction] = useActionState(loginPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-5" aria-label={formLabel}>
      <LoginFormFields
        locale={locale}
        next={next}
        state={state}
        emailLabel={emailLabel}
        passwordLabel={passwordLabel}
        submitLabel={submitLabel}
        showPasswordLabel={showPasswordLabel}
        hidePasswordLabel={hidePasswordLabel}
        navigatingLabel={navigatingLabel}
      />
    </form>
  );
}
