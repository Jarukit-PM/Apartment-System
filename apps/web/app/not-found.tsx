import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 font-sans dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">404</p>
          <p className="mt-2 text-zinc-800 dark:text-zinc-200">This page could not be found.</p>
          <Link
            href="/en"
            className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Go to home (English)
          </Link>
        </div>
      </body>
    </html>
  );
}
