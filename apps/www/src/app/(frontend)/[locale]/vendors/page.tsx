import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vendors' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function VendorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('vendors');

  const api = getApiClient();
  let vendors: Awaited<ReturnType<typeof api.getVendors>>['data'] = [];
  try {
    const res = await api.getVendors();
    vendors = res.data;
  } catch { /* graceful */ }

  const sorted = [...vendors].sort((a, b) => b.board_count - a.board_count);

  const platinum = sorted.filter((v) => v.partner_tier === 'platinum');
  const silver = sorted.filter((v) => v.partner_tier === 'silver');
  const others = sorted.filter((v) => !v.partner_tier);

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

        {/* ── Platinum Partners — featured spotlight ── */}
        {platinum.length > 0 && (
          <section className="mb-20">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 rounded-full shrink-0 bg-gradient-to-b from-amber-400 to-amber-600" />
                <h2 className="text-xl font-black tracking-tight">{t('platinum_partners')}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[rgb(var(--border)/0.3)] to-transparent hidden sm:block" />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {platinum.map((vendor, i) => (
                <ScrollReveal key={vendor.slug} delay={i * 0.06} distance={30}>
                  <Link
                    href={`/vendors/${vendor.slug}`}
                    className="group relative block rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.04] to-transparent transition-all duration-500 hover:border-amber-500/40 hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)] hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative p-6 flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.name} width={48} height={48} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-xl font-black text-gray-400">{vendor.name.charAt(0)}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base truncate group-hover:text-amber-400 transition-colors duration-300">{vendor.name}</h3>
                          <ArrowUpRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-60 transition-all duration-300 -translate-x-1 group-hover:translate-x-0 shrink-0" />
                        </div>
                        <p className="text-xs text-[rgb(var(--fg-3))]">{t('boards_count', { count: vendor.board_count })}</p>
                        <span className="inline-block mt-2 text-[8px] font-bold uppercase tracking-[0.15em] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/10">
                          Platinum
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* ── Silver Partners ── */}
        {silver.length > 0 && (
          <section className="mb-20">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 rounded-full shrink-0 bg-gradient-to-b from-gray-300 to-gray-500" />
                <h2 className="text-xl font-black tracking-tight">{t('silver_partners')}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[rgb(var(--border)/0.3)] to-transparent hidden sm:block" />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {silver.map((vendor, i) => (
                <ScrollReveal key={vendor.slug} delay={i * 0.06} distance={30}>
                  <Link
                    href={`/vendors/${vendor.slug}`}
                    className="group relative block rounded-2xl overflow-hidden border border-gray-500/15 bg-gradient-to-b from-gray-500/[0.03] to-transparent transition-all duration-500 hover:border-gray-400/30 hover:shadow-[0_20px_60px_-15px_rgba(100,116,139,0.12)] hover:-translate-y-1"
                  >
                    <div className="relative p-6 flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.name} width={48} height={48} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-xl font-black text-gray-400">{vendor.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base truncate group-hover:text-[rgb(var(--fg))] transition-colors duration-300">{vendor.name}</h3>
                          <ArrowUpRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-60 transition-all duration-300 -translate-x-1 group-hover:translate-x-0 shrink-0" />
                        </div>
                        <p className="text-xs text-[rgb(var(--fg-3))]">{t('boards_count', { count: vendor.board_count })}</p>
                        <span className="inline-block mt-2 text-[8px] font-bold uppercase tracking-[0.15em] text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/10">
                          Silver
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* ── All Manufacturers — dense logo grid ── */}
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
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    {vendor.logo_url ? (
                      <img src={vendor.logo_url} alt={vendor.name} width={36} height={36} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">{vendor.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold truncate w-full group-hover:text-[rgb(var(--brand))] transition-colors duration-300">{vendor.name}</h3>
                  <p className="text-[10px] text-[rgb(var(--fg-3))] mt-0.5">{t('boards_count', { count: vendor.board_count })}</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
