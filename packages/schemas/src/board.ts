import { z } from 'zod';

/** Support tier levels ordered by quality */
export const SupportTierEnum = z.enum(['platinum', 'standard', 'community', 'wip', 'eos', 'tvb']);
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

/**
 * Family-relative path allowlist for QDL asset references. These values are
 * concatenated into a qcombin fetch URL and a local cache path, so the
 * lookahead rejects any `..` traversal and the class forbids leading slashes,
 * `//`, and scheme separators.
 */
const QDL_REL_PATH = /^(?!.*\.\.)[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
const SHA256_HEX = /^[a-f0-9]{64}$/;

/** Default firehose loader filename inside a qcombin family directory. */
export const QDL_DEFAULT_LOADER = 'prog_firehose_ddr.elf';

const QdlMetaBase = z.object({
  family: z.string().regex(QDL_REL_PATH),
  storage: z.enum(['ufs', 'emmc']),
  loader_rel: z.string().regex(QDL_REL_PATH).nullable(),
  provision_rel: z.string().regex(QDL_REL_PATH).nullable(),
  edl_entry: z.enum(['button', 'jumper']),
  min_imager_version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

// Paths are stored family-relative; the API prepends `{family}/`, so a leading
// family segment would double it (e.g. `Makena/Makena/...`).
const rejectFamilyPrefix = (qdl: z.infer<typeof QdlMetaBase>, ctx: z.RefinementCtx): void => {
  for (const field of ['loader_rel', 'provision_rel'] as const) {
    const value = qdl[field];
    if (value && value.split('/')[0]!.toLowerCase() === qdl.family.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: 'must be family-relative, not prefixed with the family directory',
      });
    }
  }
};

/**
 * QDL enrichment input, edited by hand in enrichments.json. Lets the imager
 * resolve the firehose loader family, UFS provisioning descriptor, and
 * EDL-entry hint without a hardcoded registry.
 */
export const QdlMetaSchema = QdlMetaBase.superRefine(rejectFamilyPrefix);
export type QdlMeta = z.infer<typeof QdlMetaSchema>;

/**
 * QDL metadata as served on a board: the enrichment fields plus the SHA-256
 * digests the API computes over the cached loader and provisioning XML, so the
 * imager can verify integrity after downloading them from the API.
 */
export const BoardQdlSchema = QdlMetaBase.extend({
  loader_sha256: z.string().regex(SHA256_HEX).nullable(),
  provision_sha256: z.string().regex(SHA256_HEX).nullable(),
});
export type BoardQdl = z.infer<typeof BoardQdlSchema>;

/** Family-relative qcombin path of the firehose loader, or null for non-UFS boards. */
export function qdlLoaderRelPath(
  qdl: Pick<QdlMeta, 'family' | 'loader_rel' | 'storage'>,
): string | null {
  return qdl.storage === 'ufs' ? `${qdl.family}/${qdl.loader_rel ?? QDL_DEFAULT_LOADER}` : null;
}

/** Family-relative qcombin path of the UFS provisioning XML, or null when absent. */
export function qdlProvisionRelPath(qdl: Pick<QdlMeta, 'family' | 'provision_rel'>): string | null {
  return qdl.provision_rel ? `${qdl.family}/${qdl.provision_rel}` : null;
}

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
  qdl: BoardQdlSchema.nullable(),
});
export type BoardSummary = z.infer<typeof BoardSummarySchema>;

/** Board detail — used on board detail page */
export const BoardDetailSchema = BoardSummarySchema.extend({
  features: z.array(z.string()).default([]),
  docs_url: z.string().url(),
  forum_url: z.string().url(),
  github_url: z.string().url().nullable(),
  build_command: z.string().nullable(),
  legacy_paths: z.array(z.string()).default([]),
  maintainers: z.array(BoardMaintainerSchema).default([]),
  kernel_branches: z.array(KernelBranchInfoSchema).default([]),
});
export type BoardDetail = z.infer<typeof BoardDetailSchema>;
