import Link from "next/link";
import { Home, SearchX } from "lucide-react";

/** Used when no `[locale]` layout applies (e.g. invalid URL shape). Prefer `app/[locale]/not-found.tsx` for normal misses. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="ap-ambient-bg flex min-h-screen items-center justify-center p-6 font-sans">
        <div className="text-center">
          <span className="ap-icon-tile ap-icon-tile-lg mx-auto" aria-hidden>
            <SearchX className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <p className="ap-eyebrow mt-6">404</p>
          <p className="mt-2 text-lg font-medium text-[var(--foreground)]">This page could not be found.</p>
          <p className="mt-6">
            <Link href="/" className="ap-btn ap-btn-primary inline-flex">
              <Home className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Home
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
