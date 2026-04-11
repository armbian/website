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

/** Image format — distinguishes raw SD images from VM/rootfs alternatives */
export const ImageFormatEnum = z.enum(['sd', 'rootfs', 'qemu', 'hyperv', 'qdl']);
export type ImageFormat = z.infer<typeof ImageFormatEnum>;

/** Hardware storage variant — only UFS is tracked since eMMC is the norm */
export const StorageVariantEnum = z.enum(['ufs']);
export type StorageVariant = z.infer<typeof StorageVariantEnum>;

/** Companion file required to flash the main image (bootloader, FIP, recovery) */
export const CompanionTypeEnum = z.enum(['bootloader', 'fip', 'recovery', 'boot-partition']);
export type CompanionType = z.infer<typeof CompanionTypeEnum>;

export const CompanionFileSchema = z.object({
  type: CompanionTypeEnum,
  label: z.string(),
  url: z.string().url(),
  size_bytes: z.number().int().nonnegative(),
});
export type CompanionFile = z.infer<typeof CompanionFileSchema>;

/** Display panel variant — mutually exclusive boot partitions for devices with multiple display panels */
export const DisplayVariantSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  size_bytes: z.number().int().nonnegative(),
});
export type DisplayVariant = z.infer<typeof DisplayVariantSchema>;

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
  format: ImageFormatEnum,
  storage: StorageVariantEnum.nullable(),
  companions: z.array(CompanionFileSchema),
  display_variants: z.array(DisplayVariantSchema),
  download: DownloadInfoSchema,
});
export type Image = z.infer<typeof ImageSchema>;
