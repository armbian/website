import { ArmbianApiClient } from '@armbian/api-client';

/** Server-side API client — uses internal Docker network URL */
export function getApiClient(): ArmbianApiClient {
  const url = process.env['API_URL'] ?? 'http://localhost:3001';
  return new ArmbianApiClient(url, { timeout: 5_000, clientId: 'armbian-website' });
}

/** Format bytes to human-readable size */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`;
}
