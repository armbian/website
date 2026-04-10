import { ArmbianApiClient } from '@armbian/api-client';
import { headers } from 'next/headers';

/** Server-side API client — uses internal Docker network URL.
 *  Forwards the original client IP (from Caddy's X-Forwarded-For) to the API
 *  so access logs show the real visitor instead of the www container IP. */
export async function getApiClient(): Promise<ArmbianApiClient> {
  const url = process.env['API_URL'] ?? 'http://localhost:3001';
  let forwardedFor: string | undefined;
  try {
    const h = await headers();
    const xff = h.get('x-forwarded-for') ?? h.get('x-real-ip');
    forwardedFor = xff?.split(',')[0]?.trim() || undefined;
  } catch {
    // headers() is only available in request scope — fall back silently
  }
  return new ArmbianApiClient(url, {
    timeout: 5_000,
    clientId: 'armbian-website',
    forwardedFor,
  });
}

/** Format bytes to human-readable size */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`;
}
