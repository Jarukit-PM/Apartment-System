"use client";

import { useActionState } from "react";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { IconMail, IconPhone, IconUser, IconUserPlus } from "@/components/auth/auth-icons";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerResidentAction, type LoginState } from "@/lib/auth/actions";

const initial: LoginState = { ok: true, message: "" };

type Labels = {
  formLabel: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  passwordHint: string;
  submit: string;
  showPassword: string;
  hidePassword: string;
};

export function RegisterResidentForm({ locale, labels }: { locale: string; labels: Labels }) {
  const [state, formAction] = useActionState(registerResidentAction, initial);

  return (
    <form action={formAction} className="space-y-5" aria-label={labels.formLabel}>
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label htmlFor="reg-name" className="ap-label">
          {labels.fullName}
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ap-muted)]">
            <IconUser />
          </span>
          <input
            id="reg-name"
            name="fullName"
            type="text"
            autoComplete="name"
            autoFocus
            required
            className="ap-input !pl-10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className="ap-label">
          {labels.email}
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ap-muted)]">
            <IconMail />
          </span>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="ap-input !pl-10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-phone" className="ap-label">
          {labels.phone}
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ap-muted)]">
            <IconPhone />
          </span>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="ap-input !pl-10"
          />
        </div>
      </div>

      <PasswordInput
        id="reg-password"
        name="password"
        label={labels.password}
        autoComplete="new-password"
        minLength={8}
        hint={labels.passwordHint}
        showPasswordLabel={labels.showPassword}
        hidePasswordLabel={labels.hidePassword}
      />

      {!state.ok && state.message ? <AuthFormError message={state.message} /> : null}

      <div className="pt-1 [&_button]:w-full [&_button]:gap-2">
        <SubmitButton label={labels.submit} icon={<IconUserPlus className="h-[1.125rem] w-[1.125rem]" />} />
      </div>
    </form>
  );
}
