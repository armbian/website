import type { SupportTier } from '@armbian/schemas';

export interface SupportTierConfig {
  key: SupportTier;
  label: string;
  description: string;
  badgeColor: string;
  /** Lower number = higher quality */
  sortOrder: number;
}

export const SUPPORT_TIERS: Record<SupportTier, SupportTierConfig> = {
  platinum: {
    key: 'platinum',
    label: 'Platinum',
    description: 'Manufacturer-backed support with guaranteed maintenance.',
    badgeColor: '#d4af37',
    sortOrder: 1,
  },
  standard: {
    key: 'standard',
    label: 'Standard',
    description: 'Confirmed support with regular testing and maintenance.',
    badgeColor: '#10b981',
    sortOrder: 2,
  },
  community: {
    key: 'community',
    label: 'Community',
    description: 'Maintained by community contributors.',
    badgeColor: '#3b82f6',
    sortOrder: 3,
  },
  wip: {
    key: 'wip',
    label: 'Work in Progress',
    description: 'Initial support being developed. May have known issues.',
    badgeColor: '#f59e0b',
    sortOrder: 4,
  },
  eos: {
    key: 'eos',
    label: 'End of Support',
    description: 'No longer actively maintained.',
    badgeColor: '#6b7280',
    sortOrder: 5,
  },
  tvb: {
    key: 'tvb',
    label: 'TV Box',
    description: 'Experimental support for TV box hardware.',
    badgeColor: '#8b5cf6',
    sortOrder: 6,
  },
};

/** Compute support tier from raw source fields */
export function computeSupportTier(boardSupport: string, platinum: string): SupportTier {
  if (platinum === 'true') return 'platinum';
  if (boardSupport === 'conf') return 'standard';
  if (boardSupport === 'csc') return 'community';
  if (boardSupport === 'wip') return 'wip';
  if (boardSupport === 'tvb') return 'tvb';
  if (boardSupport === 'eos') return 'eos';
  return 'community';
}
