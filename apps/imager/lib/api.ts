import { ArmbianApiClient } from '@armbian/api-client';
import { API_CLIENT_IDS } from '@armbian/config';

/**
 * Resolve the public Armbian API base URL.
 *
 * Production: NEXT_PUBLIC_API_URL is baked at build time and points to
 *   https://api.armbian.com.
 * Dev (local Docker): falls back to Caddy on :8080 where the API is
 *   exposed on the same host.
 */
export const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:8080';

export const apiClient = new ArmbianApiClient(API_BASE, {
  clientId: API_CLIENT_IDS.IMAGER,
});

/** Health endpoint URL — used by the service-status badge which runs a
 *  no-cors HEAD probe and so can't go through the typed api-client. */
export const HEALTH_URL = `${API_BASE}/api/v1/health`;
