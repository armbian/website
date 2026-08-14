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
