"use client";

import { useActionState } from "react";
import { registerResidentAction, type LoginState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/submit-button";

const initial: LoginState = { ok: true, message: "" };

type Labels = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  submit: string;
};

export function RegisterResidentForm({ locale, labels }: { locale: string; labels: Labels }) {
  const [state, formAction] = useActionState(registerResidentAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {labels.fullName}
        </label>
        <input
          id="reg-name"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {labels.email}
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="reg-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {labels.phone}
        </label>
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {labels.password}
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>
      {!state.ok && state.message ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="pt-1 [&_button]:w-full">
        <SubmitButton label={labels.submit} />
      </div>
    </form>
  );
}
