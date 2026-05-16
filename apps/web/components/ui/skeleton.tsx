import type { ComponentProps } from "react";

type DivProps = ComponentProps<"div">;

const baseBlock = "relative overflow-hidden rounded-md ap-skeleton-shimmer";

/** Generic block placeholder (shimmer + reduced motion fallback). */
export function Skeleton({ className = "", ...props }: DivProps) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={`${baseBlock} ${className}`.trim()}
      {...props}
    />
  );
}

/** Title + subtitle + stacked cards — resident `/my/*` routes. */
export function MyPortalPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-52 max-w-[85%]" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <section className="ap-card space-y-4 p-6">
        <Skeleton className="h-3 w-24" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </section>
      <section className="ap-card space-y-4 p-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </section>
    </div>
  );
}

/** Wider grid hint for admin dashboard-style pages. */
export function DashboardPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-64 max-w-[90%]" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["a", "b", "c", "d"].map((k) => (
          <div
            key={k}
            className="ap-card p-5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="ap-card p-6">
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full max-w-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Marketing / simple locale pages. */
export function LocaleShellSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-6 px-4 py-16"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-full max-w-sm" />
      <Skeleton className="h-11 w-40 rounded-lg" />
    </div>
  );
}

/** Sidebar profile block while `/v1/me/summary` loads. */
export function SidebarUserSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-[var(--ap-border)] bg-[var(--ap-surface-solid)] p-3"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32 max-w-full" />
      </div>
    </div>
  );
}

/** Auth card (login / register). */
export function AuthCardSkeleton() {
  return (
    <div
      className="ap-glass-elevated mx-auto mt-10 max-w-md space-y-6 rounded-[var(--ap-radius-lg)] p-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-7 w-40" />
        <Skeleton className="mx-auto h-3 w-56" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <Skeleton className="mx-auto h-4 w-32" />
    </div>
  );
}
