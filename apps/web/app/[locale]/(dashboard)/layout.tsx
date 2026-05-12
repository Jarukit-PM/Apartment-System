import { PortalChrome } from "@/components/portal-chrome";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalChrome>{children}</PortalChrome>;
}
