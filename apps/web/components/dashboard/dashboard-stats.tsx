"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { resolveNavIcon, type NavIconKey } from "@/components/layout/nav-icons";

gsap.registerPlugin(useGSAP);

export type StatItem = {
  id: string;
  label: string;
  value: string;
  iconKey?: NavIconKey;
};

type Props = {
  items: StatItem[];
};

export function DashboardStats({ items }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-stat-card]", {
        opacity: 0,
        y: 24,
        scale: 0.96,
        duration: 0.65,
        stagger: 0.08,
        ease: "power3.out",
      });
    },
    { scope: gridRef },
  );

  return (
    <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = resolveNavIcon(item.iconKey ?? item.id);
        return (
          <article key={item.id} data-stat-card className="ap-card-interactive p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-[var(--ap-muted)]">{item.label}</p>
              {Icon ? (
                <span className="ap-icon-tile !h-9 !w-9 shrink-0" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
              {item.value}
            </p>
          </article>
        );
      })}
    </div>
  );
}
