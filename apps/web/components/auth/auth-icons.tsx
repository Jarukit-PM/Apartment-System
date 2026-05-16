type IconProps = { className?: string };

function iconClass(size: string, className?: string): string {
  const hasSize = className?.includes("h-") || className?.includes("w-");
  return [hasSize ? "" : size, "shrink-0 max-h-full max-w-full", className].filter(Boolean).join(" ");
}

/** Tailwind may load after first paint; keep SVG from expanding to intrinsic 300×150. */
function iconDimensions(className?: string): { width: number; height: number } {
  const match = className?.match(/h-(\d+(?:\.\d+)?)/);
  if (!match) return { width: 24, height: 24 };
  const rem = Number(match[1]) * 4;
  return { width: rem, height: rem };
}

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconBuilding({ className }: IconProps) {
  const { width, height } = iconDimensions(className);
  return (
    <svg
      className={iconClass("h-6 w-6", className)}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      aria-hidden
      {...stroke}
    >
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

export function IconLock({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconLogIn({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

export function IconUserPlus({ className }: IconProps) {
  return (
    <svg className={iconClass("h-4 w-4", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function IconEye({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ className }: IconProps) {
  return (
    <svg className={iconClass("h-[1.125rem] w-[1.125rem]", className)} viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </svg>
  );
}
