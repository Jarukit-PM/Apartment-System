import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, icon: Icon, actions }: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {Icon ? (
          <span className="ap-icon-tile ap-icon-tile-lg shrink-0" aria-hidden>
            <Icon className="h-6 w-6" strokeWidth={1.5} />
          </span>
        ) : null}
        <div className="min-w-0 space-y-2">
          <h1 className="ap-headline">{title}</h1>
          {subtitle ? <p className="ap-body max-w-2xl text-base">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
