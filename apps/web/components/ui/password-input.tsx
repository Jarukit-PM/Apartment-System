"use client";

import { useId, useState } from "react";
import { IconEye, IconEyeOff, IconLock } from "@/components/auth/auth-icons";

type Props = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  hint?: string;
  defaultValue?: string;
};

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  required = true,
  minLength,
  showPasswordLabel,
  hidePasswordLabel,
  hint,
  defaultValue,
}: Props) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();

  return (
    <div>
      <label htmlFor={id} className="ap-label">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-[var(--ap-muted)]">
          {hint}
        </p>
      ) : null}
      <div className="relative mt-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ap-muted)]">
          <IconLock />
        </span>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          defaultValue={defaultValue}
          aria-describedby={hint ? hintId : undefined}
          className="ap-input !pl-10 !pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--ap-muted)] transition hover:bg-[var(--ap-accent-soft)] hover:text-[var(--foreground)]"
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={visible}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  );
}
