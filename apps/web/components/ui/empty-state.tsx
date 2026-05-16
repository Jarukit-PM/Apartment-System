import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="ap-empty-state">
      <span className="ap-icon-tile ap-icon-tile-lg" aria-hidden>
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mt-4 font-medium text-[var(--foreground)]">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-[var(--ap-muted)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
