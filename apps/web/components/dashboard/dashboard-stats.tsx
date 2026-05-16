"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

export type StatItem = {
  id: string;
  label: string;
  value: string;
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
      {items.map((item) => (
        <article
          key={item.id}
          data-stat-card
          className="ap-card-interactive p-6"
        >
          <p className="text-sm font-medium text-[var(--ap-muted)]">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
            {item.value}
          </p>
        </article>
      ))}
    </div>
  );
}
