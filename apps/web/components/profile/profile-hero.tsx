import type { ReactNode } from "react";
import { profileInitials } from "@/lib/domain/profile-initials";

type Props = {
  fullName: string;
  subtitle?: string;
  meta?: ReactNode;
  badges?: ReactNode;
};

export function ProfileHero({ fullName, subtitle, meta, badges }: Props) {
  const initials = profileInitials(fullName);

  return (
    <section className="ap-profile-hero">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="ap-profile-avatar" aria-hidden>
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="ap-display text-2xl md:text-3xl">{fullName}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--ap-muted)]">{subtitle}</p> : null}
          {meta ? <div className="mt-2 text-sm text-[var(--foreground)]">{meta}</div> : null}
          {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
        </div>
      </div>
    </section>
  );
}
