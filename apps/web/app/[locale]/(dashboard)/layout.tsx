import { PortalChrome } from "@/components/layout/portal-chrome";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalChrome>{children}</PortalChrome>;
}
