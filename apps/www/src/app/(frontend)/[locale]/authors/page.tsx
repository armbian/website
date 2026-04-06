import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
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

  const api = getApiClient();
  let maintainers: Awaited<ReturnType<typeof api.getMaintainers>>['data'] = [];
  let boards: Awaited<ReturnType<typeof api.getBoards>>['data'] = [];
  try {
    const [mRes, bRes] = await Promise.all([
      api.getMaintainers(),
      api.getBoards({ limit: 500 }),
    ]);
    maintainers = mRes.data;
    boards = bRes.data;
  } catch { /* graceful */ }

  const boardNames: Record<string, string> = {};
  for (const b of boards) boardNames[b.slug] = b.name;

  return (
    <main className="min-h-screen">
      <PageHero className="!pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-fluid-3xl font-black tracking-tight mb-4">
              {t('hero_title')}
            </h1>
            <p className="text-fluid-base text-[rgb(var(--fg-2))] leading-relaxed max-w-2xl mx-auto">
              {t('hero_subtitle')}
            </p>
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-4">
        <TeamCatalog maintainers={maintainers} boardNames={boardNames} />
      </div>
    </main>
  );
}
