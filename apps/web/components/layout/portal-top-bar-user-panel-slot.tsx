import { Suspense } from "react";
import { SidebarUserPanel } from "@/components/layout/sidebar-user-panel";
import { TopbarUserSkeleton } from "@/components/ui/skeleton";
import type { SessionUser } from "@/lib/auth/session-user";

type ExtraLink = {
  href: string;
  label: string;
};

type Props = {
  user: SessionUser | null;
  locale: string;
  extraLinks?: ExtraLink[];
  profileHref?: string;
};

/** Top bar profile menu deferred so portal layout can paint immediately. */
export function PortalTopBarUserPanelSlot(props: Props) {
  return (
    <Suspense fallback={<TopbarUserSkeleton />}>
      <SidebarUserPanel {...props} variant="topbar" />
    </Suspense>
  );
}
