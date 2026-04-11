import { SUPPORT_TIERS } from '@armbian/config';
import type { SupportTier } from '@armbian/schemas';

export function SupportBadge({ tier, label }: { tier: SupportTier; label?: string }) {
  const config = SUPPORT_TIERS[tier];
  if (!config) return null;

  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider';

  const displayLabel = label ?? config.label;

  if (tier === 'platinum') {
    return <span className={`${base} badge-platinum`}>{displayLabel}</span>;
  }

  return (
    <span className={`${base} text-white`} style={{ backgroundColor: config.badgeColor }}>
      {displayLabel}
    </span>
  );
}
