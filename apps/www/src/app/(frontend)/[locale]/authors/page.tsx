import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { getApiClient } from '@/lib/api.server';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { TeamCatalog } from '@/components/team/team-catalog';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'team' });
  return {
    title: t('hero_title'),
    description: t('hero_subtitle'),
  };
}

export default async function AuthorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('team');

  const api = await getApiClient();
  let maintainers: Awaited<ReturnType<typeof api.getMaintainers>>['data'] = [];
  let boards: Awaited<ReturnType<typeof api.getBoards>>['data'] = [];
  try {
    const [mRes, bRes] = await Promise.all([api.getMaintainers(), api.getBoards({ limit: 500 })]);
    maintainers = mRes.data;
    boards = bRes.data;
  } catch {
    /* graceful */
  }

  const boardNames: Record<string, string> = {};
  for (const b of boards) boardNames[b.slug] = b.name;

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
        <TeamCatalog maintainers={maintainers} boardNames={boardNames} />

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
                href="/update-data"
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
