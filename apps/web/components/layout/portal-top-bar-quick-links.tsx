"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { resolveNavIcon, type NavIconKey } from "@/components/layout/nav-icons";

export type TopBarQuickLink = {
  href: string;
  label: string;
  iconKey: NavIconKey;
};

type Props = {
  links: TopBarQuickLink[];
  ariaLabel: string;
};

export function PortalTopBarQuickLinks({ links, ariaLabel }: Props) {
  const pathname = usePathname();

  return (
    <nav className="ap-topbar-quick-nav" aria-label={ariaLabel}>
      <ul className="flex items-center gap-0.5" role="list">
        {links.map((link) => {
          const Icon = resolveNavIcon(link.iconKey);
          const isActive =
            pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`ap-topbar-quick-link${isActive ? " ap-topbar-quick-link-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                title={link.label}
              >
                {Icon ? <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.75} aria-hidden /> : null}
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
