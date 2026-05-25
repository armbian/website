import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { ExpandableText } from '@/components/partner/expandable-text';
import { PARTNER_TIERS, PARTNER_TIER_ORDER, extractDomain } from '@armbian/config';
import type { Partner, PartnerTier } from '@armbian/schemas';
import { ExternalLink, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

const TIER_DESC_KEYS: Record<
  PartnerTier,
  'tier_platinum_desc' | 'tier_gold_desc' | 'tier_silver_desc'
> = {
  platinum: 'tier_platinum_desc',
  gold: 'tier_gold_desc',
  silver: 'tier_silver_desc',
};

function cleanLogo(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/-border\.png$/, '.png').replace(/\/150\//, '/480/');
}

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partners' });
  return {
    title: t('hero_title'),
    description: t('hero_subtitle'),
  };
}

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('partners');

  const api = await getApiClient();
  let partners: Partner[] = [];
  try {
    const res = await api.getPartners();
    partners = res.data;
  } catch {
    /* graceful */
  }

  const byTier: Record<PartnerTier, Partner[]> = { platinum: [], gold: [], silver: [] };
  for (const p of partners) {
    if (p.tier in byTier) byTier[p.tier as PartnerTier].push(p);
  }

  const sections = PARTNER_TIER_ORDER.map((key) => ({
    key,
    label: t(PARTNER_TIERS[key].labelKey),
    color: PARTNER_TIERS[key].badgeColor,
    description: t(TIER_DESC_KEYS[key]),
    partners: byTier[key],
  })).filter((s) => s.partners.length > 0);

  return (
    <main className="min-h-screen">
      <PageHero className="!pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-fluid-3xl font-black tracking-tight mb-4">{t('hero_title')}</h1>
            <p className="text-fluid-base text-[rgb(var(--fg-2))] leading-relaxed max-w-2xl mx-auto">
              {t('hero_subtitle')}
            </p>
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-4">
        {sections.map((section, sIdx) => (
          <section key={section.key} className={sIdx > 0 ? 'mt-12 sm:mt-14' : ''}>
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div
                  className="w-1.5 h-7 sm:h-8 rounded-full shrink-0"
                  style={{ backgroundColor: section.color }}
                />
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{section.label}</h2>
                  <p className="text-xs sm:text-sm text-[rgb(var(--fg-3))]">
                    {section.description}
                  </p>
                </div>
                <div className="flex-1 h-px bg-[rgb(var(--border)/0.3)] hidden sm:block" />
              </div>
            </ScrollReveal>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {section.partners.map((p, i) => (
                <ScrollReveal key={p.name} delay={i * 0.05} distance={25}>
                  <div className="hw-card rounded-xl sm:rounded-2xl group relative overflow-hidden flex flex-col h-full">
                    <div className="h-20 sm:h-24 flex items-center justify-center overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-white">
                      {cleanLogo(p.logo_url) ? (
                        <img
                          src={cleanLogo(p.logo_url)!}
                          alt={p.name}
                          width={120}
                          height={80}
                          className="h-12 sm:h-14 w-auto object-contain scale-[1.8]"
                        />
                      ) : (
                        <span className="text-2xl sm:text-3xl font-black text-[rgb(var(--fg-3)/0.3)]">
                          {p.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <h3 className="text-sm font-bold tracking-tight group-hover:text-[rgb(var(--brand))] transition-colors truncate mb-2">
                        {p.name}
                      </h3>
                      {p.description && (
                        <div className="flex-1">
                          <ExpandableText text={p.description} maxLength={100} />
                        </div>
                      )}
                      {p.website && (
                        <div className="mt-3 sm:mt-4 pt-3 border-t border-[rgb(var(--border)/0.3)]">
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--fg-3))] hover:text-[rgb(var(--brand))] transition-colors"
                          >
                            {extractDomain(p.website)}
                            <ExternalLink size={10} strokeWidth={2} className="opacity-50" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        ))}

        <ScrollReveal distance={40}>
          <section className="mt-16 sm:mt-20 relative rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand)/0.06)] via-transparent to-transparent pointer-events-none" />
            <div className="relative border border-[rgb(var(--brand)/0.15)] rounded-xl sm:rounded-2xl px-5 sm:px-8 py-10 sm:py-14 text-center">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-3">
                {t('cta_title')}
              </h2>
              <p className="text-xs sm:text-sm text-[rgb(var(--fg-2))] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
                {t('cta_subtitle')}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--brand))] px-5 sm:px-7 py-3 sm:py-4 text-sm font-bold text-white shadow-lg shadow-[rgb(var(--brand)/0.25)] transition-all hover:bg-[rgb(var(--brand-hover))] hover:-translate-y-0.5"
              >
                {t('cta_button')}
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </main>
  );
}
