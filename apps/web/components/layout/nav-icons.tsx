"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Receipt,
  User,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

/** Serializable icon keys — safe to pass from Server Components to client nav/stats. */
export type NavIconKey =
  | "dashboard"
  | "properties"
  | "units"
  | "residents"
  | "leases"
  | "maintenance"
  | "wallet"
  | "summary"
  | "profile"
  | "rentBook"
  | "invoices"
  | "api";

const ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  summary: LayoutDashboard,
  properties: Building2,
  units: Home,
  rentBook: Home,
  residents: Users,
  profile: User,
  leases: ClipboardList,
  maintenance: Wrench,
  wallet: Wallet,
  invoices: Receipt,
  api: Activity,
};

export function resolveNavIcon(key?: string): LucideIcon | undefined {
  if (!key) return undefined;
  return ICONS[key as NavIconKey];
}
