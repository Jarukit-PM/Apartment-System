import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  eyebrow?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  eyebrow = false,
  icon: Icon,
  children,
  className = "",
}: Props) {
  return (
    <section className={`ap-card p-6 md:p-8 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="ap-icon-tile" aria-hidden>
            <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className={eyebrow ? "ap-eyebrow" : "text-lg font-semibold tracking-tight text-[var(--foreground)]"}>
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-[var(--ap-muted)]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
