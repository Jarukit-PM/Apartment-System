"use client";

import { CheckCircle2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  closeAriaLabel?: string;
  children?: ReactNode;
};

export function SuccessDialog({
  open,
  title,
  description,
  onClose,
  closeAriaLabel = "Close",
  children,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90dvh,100%)] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl border-b-0 ap-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-[min(85dvh,calc(100%-2rem))] sm:rounded-2xl sm:p-6 sm:pb-6"
      >
        <div
          className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-[var(--ap-border-strong)] sm:hidden"
          aria-hidden
        />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-lg p-2 text-[var(--ap-muted)] transition-colors hover:bg-[var(--ap-accent-soft)] hover:text-[var(--foreground)] sm:right-3 sm:top-3"
          aria-label={closeAriaLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex flex-col items-center px-6 pt-1 text-center sm:px-8">
          <span className="ap-icon-tile ap-icon-tile-lg mb-4 text-[var(--ap-gold-deep)]" aria-hidden>
            <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--ap-muted)]">{description}</p>
          ) : null}
        </div>

        {children ? (
          <div className="mt-6 flex w-full flex-col gap-2.5 px-1 sm:px-0">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
