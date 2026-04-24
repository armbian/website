import { z } from 'zod';
import { SupportTierEnum } from './board.js';

/** API response metadata */
export const ApiMetaSchema = z.object({
  last_sync: z.string().datetime(),
  total: z.number().int().nonnegative().optional(),
});
export type ApiMeta = z.infer<typeof ApiMetaSchema>;

/** Generic API response envelope */
export function apiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: ApiMetaSchema,
  });
}

/** Pagination query parameters */
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/** Board list filter query parameters */
export const BoardFilterParamsSchema = z.object({
  vendor: z.string().optional(),
  architecture: z.string().optional(),
  support: SupportTierEnum.optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'popularity', 'support', 'random']).default('popularity'),
  promoted: z.coerce.boolean().optional(),
});
export type BoardFilterParams = z.infer<typeof BoardFilterParamsSchema>;

/** Image list filter query parameters */
export const ImageFilterParamsSchema = z.object({
  variant: z.string().optional(),
  distribution: z.string().optional(),
  branch: z.string().optional(),
  promoted: z.coerce.boolean().optional(),
});
export type ImageFilterParams = z.infer<typeof ImageFilterParamsSchema>;

/** API error response */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Health check response */
export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  version: z.string(),
  uptime: z.number(),
  lastSync: z.string().datetime().nullable(),
  nextSync: z.string().datetime().nullable(),
  counts: z.object({
    boards: z.number().int().nonnegative(),
    images: z.number().int().nonnegative(),
    vendors: z.number().int().nonnegative(),
  }),
  sources: z.record(
    z.string(),
    z.object({
      status: z.enum(['ok', 'error', 'stale']),
      lastFetch: z.string().datetime().nullable(),
      error: z.string().nullable().optional(),
    }),
  ),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
