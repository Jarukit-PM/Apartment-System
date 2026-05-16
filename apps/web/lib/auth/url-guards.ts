/** Same-origin relative path only (blocks protocol-relative and obvious open redirects). */
export function isSafeAppPath(path: string): boolean {
  const p = (path.trim().split("?")[0] ?? "").trim();
  if (!p.startsWith("/") || p.startsWith("//")) return false;
  return !p.includes("\\");
}
