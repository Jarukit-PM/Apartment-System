import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type ProfileQuickAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

type Props = {
  title: string;
  actions: ProfileQuickAction[];
};

export function ProfileQuickActions({ title, actions }: Props) {
  return (
    <section>
      <h2 className="ap-eyebrow">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2" role="list">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Link href={action.href} className="ap-profile-action-card group">
                <span className="ap-icon-tile shrink-0" aria-hidden>
                  <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{action.label}</span>
                    {action.badge ? (
                      <span className="ap-badge ap-badge-warning text-[0.6875rem]">{action.badge}</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--ap-muted)]">{action.description}</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--ap-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ap-gold-deep)]"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
