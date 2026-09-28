import { z } from 'zod';
import { QdlMetaSchema } from './board.js';

/**
 * Raw source schemas — validate upstream JSON from github.armbian.com
 * These match the actual structure of external data, not our normalized model.
 */

/** Single image asset from armbian-images.json */
export const RawImageAssetSchema = z.object({
  board_slug: z.string(),
  board_name: z.string(),
  board_vendor: z.string(),
  board_support: z.string(),
  company_name: z.string(),
  company_website: z.string(),
  company_logo: z.string(),
  armbian_version: z.string(),
  file_url: z.string(),
  file_url_asc: z.string(),
  file_url_sha: z.string(),
  file_url_torrent: z.string(),
  redi_url: z.string(),
  redi_url_asc: z.string(),
  redi_url_sha: z.string(),
  redi_url_torrent: z.string(),
  file_size: z.string(),
  file_date: z.string(),
  distro: z.string(),
  branch: z.string(),
  variant: z.string(),
  file_application: z.string(),
  promoted: z.string(),
  download_repository: z.string(),
  file_extension: z.string(),
  kernel_version: z.string(),
  platinum: z.string(),
  platinum_expired: z.string(),
  platinum_until: z.string(),
});
export type RawImageAsset = z.infer<typeof RawImageAssetSchema>;

/** Top-level armbian-images.json structure */
export const RawImagesResponseSchema = z.object({
  assets: z.array(RawImageAssetSchema),
});
export type RawImagesResponse = z.infer<typeof RawImagesResponseSchema>;

/** Partner from partners.json */
export const RawPartnerSchema = z.object({
  Account_Name: z.string(),
  company_slug: z.string().nullable().optional(),
  Description: z.string().nullable().optional(),
  Partnership_Status: z.string(),
  Website: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
});
export type RawPartner = z.infer<typeof RawPartnerSchema>;

/** Maintainer from maintainers.json */
export const RawMaintainerSchema = z.object({
  First_Name: z.string().nullable(),
  Github: z.string().nullable(),
  Team: z.array(z.string()).default([]),
  Maintaining: z.string().nullable(),
  Your_core_competences: z.array(z.string()).default([]),
  Avatar: z.string(),
  Days_since_last_activity: z.number().default(-1),
});
export type RawMaintainer = z.infer<typeof RawMaintainerSchema>;

/** Kernel description entry from kernel-description.json */
export const RawKernelBranchSchema = z.object({
  fullname: z.string(),
  description: z.string(),
});
export type RawKernelBranch = z.infer<typeof RawKernelBranchSchema>;

/** kernel-description.json: { [socFamily]: { [branch]: RawKernelBranch } } */
export const RawKernelDescriptionSchema = z.record(
  z.string(),
  z.record(z.string(), RawKernelBranchSchema),
);
export type RawKernelDescription = z.infer<typeof RawKernelDescriptionSchema>;

/** Legacy redirect entry — maintained manually in the repo */
export const LegacyRedirectEntrySchema = z.object({
  board_id: z.string(),
  canonical: z.string(),
  legacy: z.array(z.string()),
});
export type LegacyRedirectEntry = z.infer<typeof LegacyRedirectEntrySchema>;

/**
 * board-performance.json (armbian/board-performance/v1), published by
 * armbian/autotests from its hardware-in-the-loop fleet runs and served at
 * https://github.armbian.com/board-performance.json. Matches
 * armbian/autotests results/public-schema.json. Only passing test runs are
 * published; a board slug absent from `boards` was never measured or never
 * passed (see boards_skipped_no_passing_run / boards_skipped_no_measurements).
 */
const RawBoardPerformanceNetworkInterfaceSchema = z.object({
  interface: z.string(),
  type: z.string().optional(),
  up_mbits: z.number().optional(),
  down_mbits: z.number().optional(),
  wireless: z.boolean(),
  wifi_chip: z.string().optional(),
  wifi_attach: z.string().optional(),
  channel_mhz: z.number().optional(),
  channel_width_mhz: z.number().optional(),
});

export const RawBoardPerformanceEntrySchema = z.object({
  board_slug: z.string(),
  device: z.string().optional(),
  last_good_test: z.string(),
  run_url: z.string().optional(),
  image_version: z.string().optional(),
  kernel: z.string().optional(),
  summary: z
    .object({
      cpu_mhz: z.number().optional(),
      cpu_aes_MBs: z.number().optional(),
      ethernet_mbits: z.number().optional(),
      ethernet_interfaces: z.number().int().optional(),
      wifi_mbits: z.number().optional(),
      wifi_attach: z.string().optional(),
      wifi_chip: z.string().optional(),
      power_min_w: z.number().optional(),
      power_max_w: z.number().optional(),
    })
    .optional(),
  cpu: z
    .object({
      max_mhz: z.number().optional(),
      min_mhz: z.number().optional(),
      peak_mhz: z.number().optional(),
      governor: z.string().optional(),
      aes_MBs: z.number().optional(),
      temp_C: z.number().optional(),
      tested: z.string().optional(),
      run_id: z.string().optional(),
      dvfs_tested: z.string().optional(),
      dvfs_run_id: z.string().optional(),
    })
    .optional(),
  memory: z
    .object({
      copy_MBs: z.number().optional(),
      tested: z.string().optional(),
      run_id: z.string().optional(),
    })
    .optional(),
  storage: z
    .object({
      read_MBs: z.number().optional(),
      write_MBs: z.number().optional(),
      tested: z.string().optional(),
      run_id: z.string().optional(),
    })
    .optional(),
  network: z
    .object({
      tested: z.string().optional(),
      run_id: z.string().optional(),
      interfaces: z.array(RawBoardPerformanceNetworkInterfaceSchema).optional(),
    })
    .optional(),
  power: z
    .object({
      unit: z.string().optional(),
      min: z.number().optional(),
      avg: z.number().optional(),
      max: z.number().optional(),
      samples: z.number().int().optional(),
      tested: z.string().optional(),
      run_id: z.string().optional(),
    })
    .optional(),
});
export type RawBoardPerformanceEntry = z.infer<typeof RawBoardPerformanceEntrySchema>;

/** Top-level board-performance.json structure */
export const RawBoardPerformanceResponseSchema = z.object({
  schema: z.literal('armbian/board-performance/v1'),
  source: z.string(),
  run_url_template: z.string().optional(),
  generated: z.string(),
  boards_total: z.number().int(),
  boards_skipped_no_passing_run: z.array(z.string()).optional(),
  boards_skipped_no_measurements: z.array(z.string()).optional(),
  boards: z.array(RawBoardPerformanceEntrySchema),
});
export type RawBoardPerformanceResponse = z.infer<typeof RawBoardPerformanceResponseSchema>;

/** Manual board enrichment — optional extra metadata */
export const BoardEnrichmentSchema = z.object({
  slug: z.string(),
  soc: z.string().optional(),
  architecture: z.string().optional(),
  features: z.array(z.string()).optional(),
  summary: z.string().optional(),
  qdl: QdlMetaSchema.optional(),
});
export type BoardEnrichment = z.infer<typeof BoardEnrichmentSchema>;
