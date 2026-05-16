import { AuthImmersiveShell } from "@/components/auth/auth-immersive-shell";

export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return <AuthImmersiveShell>{children}</AuthImmersiveShell>;
}
