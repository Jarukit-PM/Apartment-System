"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "@/i18n/navigation";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { resolveNavIcon, type NavIconKey } from "@/components/layout/nav-icons";

gsap.registerPlugin(useGSAP);

export type PortalNavItem = {
  href: string;
  label: string;
  iconKey?: NavIconKey;
};

export type PortalNavSection = {
  id: string;
  label?: string;
  items: PortalNavItem[];
};

type Props = {
  sections: PortalNavSection[];
  ariaLabel: string;
};

function flattenItems(sections: PortalNavSection[]): PortalNavItem[] {
  return sections.flatMap((s) => s.items);
}

export function PortalNav({ sections, ariaLabel }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const allItems = flattenItems(sections);

  const activeHref =
    allItems
      .filter((item) => pathname === item.href || pathname.endsWith(item.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? allItems[0]?.href;

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
    <nav ref={navRef} className="relative" aria-label={ariaLabel}>
      <span ref={pillRef} className="ap-nav-pill opacity-0" aria-hidden />
      {sections.map((section) => (
        <div key={section.id} className="ap-nav-section">
          {section.label ? <p className="ap-nav-section-label">{section.label}</p> : null}
          <ul className="ap-nav-list" role="list">
            {section.items.map((item) => {
              const isActive = item.href === activeHref;
              const Icon = resolveNavIcon(item.iconKey);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    data-href={item.href}
                    data-active={isActive ? "true" : "false"}
                    aria-current={isActive ? "page" : undefined}
                    className="ap-nav-link"
                  >
                    {Icon ? (
                      <Icon
                        className={`h-[1.125rem] w-[1.125rem] shrink-0 ${isActive ? "text-[var(--ap-gold-deep)]" : "opacity-70"}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : null}
                    <span className="ap-nav-link-label truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
