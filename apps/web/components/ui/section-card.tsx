import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Props = {
  title: string;
  description?: string;
  eyebrow?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  id?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionCard({
  title,
  description,
  eyebrow = false,
  icon: Icon,
  children,
  className = "",
  id,
  href,
  linkLabel,
}: Props) {
  const scrollClass = id ? "scroll-mt-28" : "";
  const cardClass =
    `ap-card p-6 md:p-8 ${scrollClass} ${href ? "ap-card-interactive group block no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ap-accent)]" : ""} ${className}`.trim();

  const header = (
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
      {href ? (
        <ChevronRight
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ap-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ap-gold-deep)]"
          aria-hidden
        />
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} id={id} className={cardClass} aria-label={linkLabel ?? title}>
        {header}
        <div className="mt-5 text-[var(--foreground)]">{children}</div>
      </Link>
    );
  }

  return (
    <section id={id} className={cardClass}>
      {header}
      <div className="mt-5">{children}</div>
    </section>
  );
}
