import type { PartnerTier } from '@armbian/schemas';

export interface PartnerTierConfig {
  key: PartnerTier;
  sortOrder: number;
  /** Key in the `vendors` i18n namespace */
  headerKey: 'platinum_partners' | 'gold_partners' | 'silver_partners';
  /** Key in the `partners` i18n namespace */
  labelKey: 'tier_platinum' | 'tier_gold' | 'tier_silver';
  badgeColor: string;
}

export const PARTNER_TIERS: Record<PartnerTier, PartnerTierConfig> = {
  platinum: {
    key: 'platinum',
    sortOrder: 1,
    headerKey: 'platinum_partners',
    labelKey: 'tier_platinum',
    badgeColor: '#d4af37',
  },
  gold: {
    key: 'gold',
    sortOrder: 2,
    headerKey: 'gold_partners',
    labelKey: 'tier_gold',
    badgeColor: '#eab308',
  },
  silver: {
    key: 'silver',
    sortOrder: 3,
    headerKey: 'silver_partners',
    labelKey: 'tier_silver',
    badgeColor: '#94a3b8',
  },
};

export const PARTNER_TIER_ORDER: readonly PartnerTier[] = Object.values(PARTNER_TIERS)
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => c.key);
