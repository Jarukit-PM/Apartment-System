type Variant = "default" | "success" | "warning" | "danger" | "muted";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  default: "ap-badge",
  success: "ap-badge ap-badge-success",
  warning: "ap-badge ap-badge-warning",
  danger: "ap-badge ap-badge-danger",
  muted: "ap-badge ap-badge-muted",
};

export function StatusBadge({ children, variant = "default" }: Props) {
  return <span className={variants[variant]}>{children}</span>;
}

/** Map lease / maintenance / unit status strings to badge variants. */
export function statusVariant(status: string): Variant {
  const s = status.toLowerCase();
  if (s === "active" || s === "resolved" || s === "paid" || s === "available") return "success";
  if (s === "draft" || s === "open" || s === "pending") return "warning";
  if (s === "ended" || s === "cancelled" || s === "occupied") return "muted";
  if (s === "overdue" || s === "failed") return "danger";
  return "default";
}
