import { ArmbianApiClient } from '@armbian/api-client';
import { API_CLIENT_IDS } from '@armbian/config';

// Empty default → relative paths, proxied by next.config rewrite.
export const API_BASE =
  (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_API_URL']) || '';

export const apiClient = new ArmbianApiClient(API_BASE, {
  clientId: API_CLIENT_IDS.IMAGER,
});
