import { apiBaseUrl } from "@/lib/api";

type HealthResponse = {
  status: string;
  mongo: string;
};

async function fetchHealth(): Promise<HealthResponse | null> {
  const base = apiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await fetchHealth();

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Apartment System
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Stack health
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This page loads data from the Go API using{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
            API_URL
          </code>{" "}
          (server-side). Configure both{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
            API_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          per{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
            .env.example
          </code>
          .
        </p>

        <dl className="mt-8 space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">API base</dt>
            <dd className="truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
              {apiBaseUrl()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">API status</dt>
            <dd className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {health ? health.status : "unreachable"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">MongoDB</dt>
            <dd className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {health ? health.mongo : "—"}
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
