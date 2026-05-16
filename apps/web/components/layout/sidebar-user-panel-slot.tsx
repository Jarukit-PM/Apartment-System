import { Suspense } from "react";
import { SidebarUserPanel } from "@/components/layout/sidebar-user-panel";
import { SidebarUserSkeleton } from "@/components/ui/skeleton";
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

/** Sidebar profile deferred so portal layout can paint immediately. */
export function SidebarUserPanelSlot(props: Props) {
  return (
    <Suspense fallback={<SidebarUserSkeleton />}>
      <SidebarUserPanel {...props} />
    </Suspense>
  );
}
