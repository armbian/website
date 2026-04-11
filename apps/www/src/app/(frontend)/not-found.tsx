import './globals.css';
import '@fontsource-variable/dm-sans';

export default function RootNotFound() {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased font-sans bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="text-7xl font-black text-[rgb(var(--brand))]">404</p>
          <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
          <p className="mt-2 text-[rgb(var(--fg-2))]">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--brand))] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-hover))]"
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
