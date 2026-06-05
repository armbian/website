import { ArmbianApiClient } from '@armbian/api-client';
import { API_CLIENT_IDS } from '@armbian/config';

// Empty default keeps requests relative so next.config rewrite can proxy them.
export const API_BASE =
  (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_API_URL']) || '';

export const apiClient = new ArmbianApiClient(API_BASE, {
  clientId: API_CLIENT_IDS.IMAGER,
});
