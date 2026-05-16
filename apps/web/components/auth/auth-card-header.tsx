import { AuthLocaleSwitcher } from "@/components/auth/auth-locale-switcher";
import { IconBuilding, IconUserPlus } from "@/components/auth/auth-icons";

type Props = {
  brand: string;
  languageLabel: string;
  title: string;
  subtitle?: string;
  variant?: "login" | "register";
};

export function AuthCardHeader({ brand, languageLabel, title, subtitle, variant = "login" }: Props) {
  const Icon = variant === "register" ? IconUserPlus : IconBuilding;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="ap-eyebrow">{brand}</p>
        <AuthLocaleSwitcher label={languageLabel} />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--ap-border)] bg-gradient-to-br from-[var(--ap-gold-light)] to-[var(--ap-accent-soft)] text-[var(--ap-gold-deep)] shadow-sm"
          aria-hidden
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="ap-display mt-4 text-3xl md:text-4xl">{title}</h1>
        {subtitle ? <p className="ap-body mt-2 max-w-sm text-sm text-[var(--ap-muted)]">{subtitle}</p> : null}
      </div>
    </>
  );
}
