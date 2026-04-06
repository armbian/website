import { z } from 'zod';
import { PartnerTierEnum } from './vendor.js';

/** Partner organization */
export const PartnerSchema = z.object({
  name: z.string(),
  tier: PartnerTierEnum,
  website: z.string().url().nullable(),
  logo_url: z.string().url().nullable(),
  description: z.string().nullable(),
});
export type Partner = z.infer<typeof PartnerSchema>;
