"use client";

/** Covers the auth card during post-login navigation (no brand/building icon). */
export function AuthNavigatingOverlay({ label = "Signing you in" }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 ap-ambient-bg"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--ap-border)] border-t-[var(--ap-accent)]"
        aria-hidden
      />
    </div>
  );
}
