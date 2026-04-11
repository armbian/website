'use client';

import './globals.css';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased font-sans bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="text-7xl font-black text-red-500">500</p>
          <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-[rgb(var(--fg-2))]">
            An unexpected error occurred. Please try again.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--brand))] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-hover))]"
            >
              Go home
            </a>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[rgb(var(--bg-sub))]"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
