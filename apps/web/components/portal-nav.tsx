"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "@/i18n/navigation";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";

gsap.registerPlugin(useGSAP);

export type PortalNavItem = {
  href: string;
  label: string;
};

type Props = {
  items: PortalNavItem[];
  ariaLabel: string;
};

export function PortalNav({ items, ariaLabel }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  const activeHref =
    items
      .filter((item) => pathname === item.href || pathname.endsWith(item.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? items[0]?.href;

  useGSAP(
    () => {
      const activeLink = navRef.current?.querySelector<HTMLElement>(`[data-href="${activeHref}"]`);
      const pill = pillRef.current;
      if (!activeLink || !pill || !navRef.current) return;

      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();

      gsap.to(pill, {
        y: linkRect.top - navRect.top,
        height: linkRect.height,
        opacity: 1,
        duration: 0.45,
        ease: "power3.out",
      });
    },
    { dependencies: [activeHref], scope: navRef, revertOnUpdate: true },
  );

  return (
    <nav ref={navRef} className="relative flex flex-col gap-0.5" aria-label={ariaLabel}>
      <span ref={pillRef} className="ap-nav-pill opacity-0" aria-hidden />
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-href={item.href}
            className={`relative z-[1] rounded-[0.625rem] px-3 py-2.5 text-[0.9375rem] font-medium transition-colors ${
              isActive
                ? "font-medium text-[var(--ap-gold-deep)]"
                : "text-[var(--ap-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
