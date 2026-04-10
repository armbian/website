import { ArmbianApiClient } from './client.js';

/** Create API client for server-side use (Next.js server components, API routes) */
export function createServerClient(): ArmbianApiClient {
  const url = process.env['API_URL'] ?? 'http://localhost:3001';
  return new ArmbianApiClient(url, { timeout: 5_000, clientId: 'armbian-website' });
}

/** Create API client for browser-side use (client components) */
export function createBrowserClient(): ArmbianApiClient {
  const url = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
  return new ArmbianApiClient(url, { timeout: 10_000, clientId: 'armbian-website' });
}
