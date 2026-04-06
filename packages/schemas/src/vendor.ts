import { z } from 'zod';

/** Partner tier classification */
export const PartnerTierEnum = z.enum(['platinum', 'gold', 'silver']);
export type PartnerTier = z.infer<typeof PartnerTierEnum>;

/** Vendor entity */
export const VendorSchema = z.object({
  slug: z.string(),
  name: z.string(),
  logo_url: z.string().url().nullable(),
  website: z.string().url().nullable(),
  description: z.string().nullable(),
  board_count: z.number().int().nonnegative(),
  partner_tier: PartnerTierEnum.nullable(),
});
export type Vendor = z.infer<typeof VendorSchema>;
