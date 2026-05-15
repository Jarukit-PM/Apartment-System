import type { ReactNode } from "react";

type Props = {
  brand: string;
  title: string;
  nav: ReactNode;
  sidebarFooter: ReactNode;
  children: ReactNode;
};

export function PortalShell({ brand, title, nav, sidebarFooter, children }: Props) {
  return (
    <div className="ap-ambient-bg flex min-h-dvh flex-col md:flex-row">
      <aside className="ap-glass z-20 flex w-full shrink-0 flex-col border-b border-[var(--ap-border)] md:w-72 md:border-b-0 md:border-r">
        <div className="flex flex-1 flex-col px-4 py-6 md:max-h-dvh md:py-8">
          <div className="mb-6 px-1">
            <p className="ap-eyebrow">{brand}</p>
            <p className="mt-1 text-[1rem] font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1">{nav}</div>
          <div className="mt-6 border-t border-[var(--ap-border)] pt-5">{sidebarFooter}</div>
        </div>
      </aside>
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="ap-content-enter flex-1 px-5 py-8 md:px-12 md:py-12">{children}</main>
      </div>
    </div>
  );
}
