import type { PortalNavSection } from "@/components/layout/portal-nav";

export type NavCrumb = {
  href?: string;
  label: string;
};

export type ResolvedNavPage = {
  title: string;
  crumbs: NavCrumb[];
};

function flattenSections(sections: PortalNavSection[]) {
  return sections.flatMap((s) => s.items);
}

/** Longest-prefix match for sidebar/topbar page titles and breadcrumbs. */
export function resolveNavPage(
  pathname: string,
  sections: PortalNavSection[],
  options: { fallbackTitle: string; detailsLabel: string },
): ResolvedNavPage {
  const items = flattenSections(sections);
  const match = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (!match) {
    return { title: options.fallbackTitle, crumbs: [{ label: options.fallbackTitle }] };
  }

  if (pathname === match.href) {
    return { title: match.label, crumbs: [{ href: match.href, label: match.label }] };
  }

  return {
    title: options.detailsLabel,
    crumbs: [
      { href: match.href, label: match.label },
      { label: options.detailsLabel },
    ],
  };
}
