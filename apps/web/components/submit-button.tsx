"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger" | "ghost";
};

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600",
  ghost:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
};

export function SubmitButton({ label, pendingLabel, variant = "primary" }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${base} ${variants[variant]}`}>
      {pending ? (pendingLabel ?? label) : label}
    </button>
  );
}
