"use client";

import { useActionState } from "react";
import { loginPasswordAction, type LoginState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/submit-button";

const initial: LoginState = { ok: true, message: "" };

type Props = {
  locale: string;
  next?: string;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
};

export function LoginPasswordForm({ locale, next, emailLabel, passwordLabel, submitLabel }: Props) {
  const [state, formAction] = useActionState(loginPasswordAction, initial);
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label htmlFor="login-email" className="ap-label">
          {emailLabel}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="ap-input"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="ap-label">
          {passwordLabel}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="ap-input"
        />
      </div>
      {!state.ok && state.message ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="pt-1 [&_button]:w-full">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
