import { ArmbianApiClient } from '@armbian/api-client';
import { API_CLIENT_IDS, DEFAULT_API_URL } from '@armbian/config';
import { headers } from 'next/headers';

/** Server-side API client — uses internal Docker network URL.
 *  Forwards the original client IP (from Caddy's X-Forwarded-For) to the API
 *  so access logs show the real visitor instead of the www container IP. */
export async function getApiClient(): Promise<ArmbianApiClient> {
  const url = process.env['API_URL'] ?? DEFAULT_API_URL;
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
    clientId: API_CLIENT_IDS.WEBSITE,
    forwardedFor,
  });
}
