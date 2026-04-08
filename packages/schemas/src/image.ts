import { z } from 'zod';

/** Download file metadata */
export const DownloadInfoSchema = z.object({
  file_url: z.string().url(),
  direct_url: z.string().url(),
  sha_url: z.string().url().nullable(),
  asc_url: z.string().url().nullable(),
  torrent_url: z.string().url().nullable(),
  size_bytes: z.number().int().nonnegative(),
  updated_at: z.string().datetime(),
});
export type DownloadInfo = z.infer<typeof DownloadInfoSchema>;

/** Image stability classification */
export const StabilityEnum = z.enum(['stable', 'edge', 'nightly']);
export type Stability = z.infer<typeof StabilityEnum>;

/** Single downloadable image */
export const ImageSchema = z.object({
  id: z.string(),
  board_slug: z.string(),
  variant: z.string(),
  distribution: z.string(),
  release: z.string(),
  kernel_branch: z.string(),
  kernel_version: z.string(),
  application: z.string().nullable(),
  promoted: z.boolean(),
  stability: StabilityEnum,
  download: DownloadInfoSchema,
});
export type Image = z.infer<typeof ImageSchema>;
