import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
import { ApiClientError } from '@armbian/api-client';
import { PARTNER_TIERS, SUPPORT_TIERS } from '@armbian/config';
import { BoardCard } from '@/components/board/board-card';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Link } from '@/i18n/navigation';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'vendors' });
  try {
    const api = await getApiClient();
    const res = await api.getVendor(slug);
    return {
      title: `${res.data.name} ${t('title')}`,
      description: t('boards_count', { count: res.data.board_count }),
    };
  } catch {
    return { title: 'Vendor' };
  }
}

export default async function VendorPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [t, tp] = await Promise.all([getTranslations('vendors'), getTranslations('partners')]);

  const api = await getApiClient();
  let vendor: Awaited<ReturnType<typeof api.getVendor>>['data'];
  try {
    const res = await api.getVendor(slug);
    vendor = res.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.isNotFound) notFound();
    throw err;
  }

  return (
    <div>
      <PageHero>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <Link
              href="/vendors"
              className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors mb-6"
            >
              <ArrowLeft size={12} strokeWidth={2} />
              {t('title')}
            </Link>
            <div className="flex items-center gap-5">
              {vendor.logo_url ? (
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  <img
                    src={vendor.logo_url}
                    alt={vendor.name}
                    width={56}
                    height={56}
                    className="w-12 h-12 object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--bg-sub))] flex items-center justify-center shrink-0 text-2xl font-black text-[rgb(var(--fg-3))]">
                  {vendor.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-fluid-2xl font-black tracking-tight">{vendor.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-[rgb(var(--fg-2))]">
                    {t('boards_count', { count: vendor.board_count })}
                  </span>
                  {vendor.partner_tier && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{
                        color: PARTNER_TIERS[vendor.partner_tier].badgeColor,
                        backgroundColor: `${PARTNER_TIERS[vendor.partner_tier].badgeColor}1a`,
                      }}
                    >
                      {tp(PARTNER_TIERS[vendor.partner_tier].labelKey)} {t('partner')}
                    </span>
                  )}
                </div>
                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--brand))] hover:underline mt-2"
                  >
                    {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink size={10} strokeWidth={2} />
                  </a>
                )}
              </div>
            </div>
            {vendor.description && (
              <p className="mt-4 text-sm text-[rgb(var(--fg-2))] max-w-2xl leading-relaxed">
                {vendor.description}
              </p>
            )}
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...vendor.boards]
            .sort(
              (a, b) =>
                (SUPPORT_TIERS[a.support_tier]?.sortOrder ?? 99) -
                (SUPPORT_TIERS[b.support_tier]?.sortOrder ?? 99),
            )
            .map((board, i) => (
              <ScrollReveal key={board.slug} delay={Math.min(i * 0.04, 0.4)}>
                <BoardCard board={board} />
              </ScrollReveal>
            ))}
        </div>
      </div>
    </div>
  );
}
