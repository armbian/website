import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { ArrowUpRight } from 'lucide-react';
import { PARTNER_TIERS, PARTNER_TIER_ORDER } from '@armbian/config';
import type { PartnerTier, Vendor } from '@armbian/schemas';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

type VendorsT = Awaited<ReturnType<typeof getTranslations<'vendors'>>>;

const TIER_CLASSES: Record<
  PartnerTier,
  { bar: string; card: string; title: string; badge: string }
> = {
  platinum: {
    bar: 'bg-gradient-to-b from-amber-400 to-amber-600',
    card: 'border-amber-500/20 from-amber-500/[0.04] hover:border-amber-500/40 hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)]',
    title: 'group-hover:text-amber-400',
    badge: 'text-amber-400/80 bg-amber-500/10 border-amber-500/10',
  },
  gold: {
    bar: 'bg-gradient-to-b from-yellow-300 to-yellow-500',
    card: 'border-yellow-500/20 from-yellow-500/[0.04] hover:border-yellow-500/40 hover:shadow-[0_20px_60px_-15px_rgba(234,179,8,0.15)]',
    title: 'group-hover:text-yellow-300',
    badge: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/15',
  },
  silver: {
    bar: 'bg-gradient-to-b from-gray-300 to-gray-500',
    card: 'border-gray-500/15 from-gray-500/[0.03] hover:border-gray-400/30 hover:shadow-[0_20px_60px_-15px_rgba(100,116,139,0.12)]',
    title: 'group-hover:text-[rgb(var(--fg))]',
    badge: 'text-gray-400 bg-gray-500/10 border-gray-500/10',
  },
};

function VendorLogo({ vendor, size }: { vendor: Vendor; size: 'lg' | 'sm' }) {
  const box = size === 'lg' ? 'w-16 h-16 rounded-xl' : 'w-12 h-12 rounded-lg';
  const img = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const fallback = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <div className={`${box} bg-white flex items-center justify-center shrink-0 shadow-sm`}>
      {vendor.logo_url ? (
        <img
          src={vendor.logo_url}
          alt={vendor.name}
          width={size === 'lg' ? 48 : 36}
          height={size === 'lg' ? 48 : 36}
          className={`${img} object-contain`}
        />
      ) : (
        <span className={`${fallback} font-black text-gray-400`}>{vendor.name.charAt(0)}</span>
      )}
    </div>
  );
}

function TierCard({
  vendor,
  tier,
  badgeLabel,
  t,
}: {
  vendor: Vendor;
  tier: PartnerTier;
  badgeLabel: string;
  t: VendorsT;
}) {
  const cls = TIER_CLASSES[tier];
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className={`group relative block rounded-2xl overflow-hidden border bg-gradient-to-b to-transparent transition-all duration-500 hover:-translate-y-1 ${cls.card}`}
    >
      <div className="relative p-6 flex items-center gap-5">
        <VendorLogo vendor={vendor} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-bold text-base truncate transition-colors duration-300 ${cls.title}`}
            >
              {vendor.name}
            </h3>
            <ArrowUpRight
              size={14}
              strokeWidth={2}
              className="opacity-0 group-hover:opacity-60 transition-all duration-300 -translate-x-1 group-hover:translate-x-0 shrink-0"
            />
          </div>
          <p className="text-xs text-[rgb(var(--fg-3))]">
            {t('boards_count', { count: vendor.board_count })}
          </p>
          <span
            className={`inline-block mt-2 text-[8px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${cls.badge}`}
          >
            {badgeLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TierSection({
  tier,
  vendors,
  tierLabels,
  t,
}: {
  tier: PartnerTier;
  vendors: Vendor[];
  tierLabels: Record<PartnerTier, string>;
  t: VendorsT;
}) {
  if (vendors.length === 0) return null;
  const cls = TIER_CLASSES[tier];
  return (
    <section className="mb-20">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-1.5 h-8 rounded-full shrink-0 ${cls.bar}`} />
          <h2 className="text-xl font-black tracking-tight">{t(PARTNER_TIERS[tier].headerKey)}</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[rgb(var(--border)/0.3)] to-transparent hidden sm:block" />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor, i) => (
          <ScrollReveal key={vendor.slug} delay={i * 0.06} distance={30}>
            <TierCard vendor={vendor} tier={tier} badgeLabel={tierLabels[tier]} t={t} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vendors' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function VendorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tp] = await Promise.all([getTranslations('vendors'), getTranslations('partners')]);
  const tierLabels: Record<PartnerTier, string> = {
    platinum: tp(PARTNER_TIERS.platinum.labelKey),
    gold: tp(PARTNER_TIERS.gold.labelKey),
    silver: tp(PARTNER_TIERS.silver.labelKey),
  };

  const api = await getApiClient();
  let vendors: Vendor[] = [];
  try {
    const res = await api.getVendors();
    vendors = res.data;
  } catch {
    /* graceful */
  }

  const sorted = [...vendors].sort((a, b) => b.board_count - a.board_count);

  const byTier: Record<PartnerTier, Vendor[]> = { platinum: [], gold: [], silver: [] };
  const others: Vendor[] = [];
  for (const v of sorted) {
    if (v.partner_tier && v.partner_tier in byTier) byTier[v.partner_tier].push(v);
    else others.push(v);
  }

  return (
    <div className="min-h-screen">
      <PageHero className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-fluid-3xl font-black tracking-tight leading-[0.95] mb-4">
                {t('title')}
              </h1>
              <p className="text-fluid-lg text-[rgb(var(--fg-2))] leading-relaxed">
                {sorted.length} {t('subtitle')}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {PARTNER_TIER_ORDER.map((tier) => (
          <TierSection
            key={tier}
            tier={tier}
            vendors={byTier[tier]}
            tierLabels={tierLabels}
            t={t}
          />
        ))}

        <section>
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 rounded-full shrink-0 bg-[rgb(var(--fg-3)/0.3)]" />
              <h2 className="text-xl font-black tracking-tight">{t('title')}</h2>
              <span className="text-xs text-[rgb(var(--fg-3))] font-mono">{others.length}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[rgb(var(--border)/0.3)] to-transparent hidden sm:block" />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {others.map((vendor, i) => (
              <ScrollReveal key={vendor.slug} delay={Math.min(i * 0.02, 0.4)} distance={15}>
                <Link
                  href={`/vendors/${vendor.slug}`}
                  className="group relative flex flex-col items-center text-center rounded-xl border border-[rgb(var(--border)/0.4)] bg-[rgb(var(--bg-el)/0.2)] p-4 transition-all duration-400 hover:border-[rgb(var(--brand)/0.3)] hover:bg-[rgb(var(--bg-el)/0.5)] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20"
                >
                  <VendorLogo vendor={vendor} size="sm" />
                  <h3 className="text-xs font-bold truncate w-full mt-3 group-hover:text-[rgb(var(--brand))] transition-colors duration-300">
                    {vendor.name}
                  </h3>
                  <p className="text-[10px] text-[rgb(var(--fg-3))] mt-0.5">
                    {t('boards_count', { count: vendor.board_count })}
                  </p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
