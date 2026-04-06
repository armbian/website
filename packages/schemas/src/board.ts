import { z } from 'zod';

/** Support tier levels ordered by quality */
export const SupportTierEnum = z.enum([
  'platinum',
  'standard',
  'community',
  'wip',
  'eos',
  'tvb',
]);
export type SupportTier = z.infer<typeof SupportTierEnum>;

/** Maintainer reference embedded in board detail */
export const BoardMaintainerSchema = z.object({
  name: z.string(),
  avatar: z.string().url(),
  github: z.string().url().nullable(),
});
export type BoardMaintainer = z.infer<typeof BoardMaintainerSchema>;

/** Kernel branch info for a board */
export const KernelBranchInfoSchema = z.object({
  branch: z.string(),
  kernel_version: z.string(),
  description: z.string().nullable(),
});
export type KernelBranchInfo = z.infer<typeof KernelBranchInfoSchema>;

/** Board summary — used in list/catalog endpoints */
export const BoardSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  vendor_slug: z.string(),
  vendor_name: z.string(),
  support_tier: SupportTierEnum,
  image_count: z.number().int().nonnegative(),
  has_desktop: z.boolean(),
  promoted: z.boolean(),
  image_url: z.string().url().nullable(),
  soc: z.string().nullable(),
  architecture: z.string().nullable(),
  summary: z.string().nullable(),
});
export type BoardSummary = z.infer<typeof BoardSummarySchema>;

/** Board detail — used on board detail page */
export const BoardDetailSchema = BoardSummarySchema.extend({
  features: z.array(z.string()).default([]),
  docs_url: z.string().url(),
  forum_url: z.string().url(),
  github_url: z.string().url().nullable(),
  build_command: z.string(),
  legacy_paths: z.array(z.string()).default([]),
  maintainers: z.array(BoardMaintainerSchema).default([]),
  kernel_branches: z.array(KernelBranchInfoSchema).default([]),
});
export type BoardDetail = z.infer<typeof BoardDetailSchema>;
