import Link from "next/link";

/** Used when no `[locale]` layout applies (e.g. invalid URL shape). Prefer `app/[locale]/not-found.tsx` for normal misses. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 font-sans dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">404</p>
          <p className="mt-2 text-zinc-800 dark:text-zinc-200">This page could not be found.</p>
          <p className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-medium">
            <Link href="/" className="text-zinc-900 underline dark:text-zinc-100">
              Home
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
