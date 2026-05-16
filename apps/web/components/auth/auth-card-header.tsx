import { IconBuilding, IconUserPlus } from "@/components/auth/auth-icons";

type Props = {
  title: string;
  subtitle?: string;
  variant?: "login" | "register";
};

export function AuthCardHeader({ title, subtitle, variant = "login" }: Props) {
  const Icon = variant === "register" ? IconUserPlus : IconBuilding;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ap-border)] bg-gradient-to-br from-[var(--ap-gold-light)] to-[var(--ap-accent-soft)] text-[var(--ap-gold-deep,#9a7b3c)] shadow-sm"
        aria-hidden
      >
        <Icon className="h-7 w-7 text-[var(--ap-gold-deep,#9a7b3c)]" />
      </div>
      <h1 className="ap-display mt-4 text-3xl md:text-4xl">{title}</h1>
      {subtitle ? <p className="ap-body mt-2 max-w-sm text-sm text-[var(--ap-muted)]">{subtitle}</p> : null}
    </div>
  );
}
