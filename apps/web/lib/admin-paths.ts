/** Locale-stripped paths under `app/[locale]/(dashboard)/` — admin console only. */
export const ADMIN_REST_PREFIXES = [
  "/dashboard",
  "/properties",
  "/units",
  "/residents",
  "/leases",
  "/maintenance",
] as const;

export function isAdminPortalPath(rest: string): boolean {
  for (const p of ADMIN_REST_PREFIXES) {
    if (rest === p || rest.startsWith(`${p}/`)) return true;
  }
  return false;
}
