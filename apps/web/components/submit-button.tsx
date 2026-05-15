"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger" | "ghost";
};

const base =
  "ap-btn inline-flex items-center justify-center disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ap-accent)]";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "ap-btn-primary",
  danger:
    "!rounded-[0.75rem] !bg-red-600 !text-white hover:!bg-red-500 !shadow-none focus-visible:!outline-red-600",
  ghost: "ap-btn-secondary !rounded-[0.75rem]",
};

export function SubmitButton({ label, pendingLabel, variant = "primary" }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${base} ${variants[variant]} ${
        pending ? "cursor-wait opacity-90 motion-safe:animate-pulse" : ""
      }`}
    >
      {pending ? (pendingLabel ?? label) : label}
    </button>
  );
}
