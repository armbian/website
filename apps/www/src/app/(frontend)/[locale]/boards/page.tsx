import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { BoardsCatalog } from '@/components/board/boards-catalog';
import { BoardGridSkeleton } from '@/components/ui/skeleton';
import { shuffle } from '@armbian/config';
import type { BoardSummary, Vendor } from '@armbian/schemas';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'boards' });

  let total = 0;
  let vendorCount = 0;
  try {
    const api = await getApiClient();
    const result = await api.getBoardsInit();
    total = result.data.total;
    vendorCount = result.data.vendors.length;
  } catch {
    /* graceful */
  }

  return {
    title: t('hero_title'),
    description: t('hero_subtitle', {
      boards: String(total || '--'),
      vendors: String(vendorCount || '--'),
    }),
    other: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
  };
}

export default async function BoardsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('boards');

  let initialBoards: BoardSummary[] = [];
  let platinumBoards: BoardSummary[] = [];
  let vendors: Vendor[] = [];
  let total = 0;
  let tierCounts: Record<string, number> = {};
  try {
    const api = await getApiClient();
    const result = await api.getBoardsInit();
    initialBoards = result.data.boards;
    // Shuffle platinum boards on every request so the featured strip
    // below rotates — every paid platinum partner gets a fair chance of
    // appearing in the top 4 across visits instead of always the same.
    platinumBoards = shuffle(result.data.platinumBoards);
    vendors = result.data.vendors;
    total = result.data.total;
    tierCounts = result.data.tierCounts;
  } catch {
    /* graceful */
  }

  return (
    <div className="min-h-screen">
      <PageHero className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-fluid-3xl font-black tracking-tight leading-[0.95] mb-4">
                {t('hero_title')}
              </h1>
              <p className="text-fluid-lg text-[rgb(var(--fg-2))] leading-relaxed max-w-2xl mx-auto">
                {t('hero_subtitle', {
                  boards: String(total || '--'),
                  vendors: String(vendors.length || '--'),
                })}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </PageHero>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="pt-8">
                <BoardGridSkeleton count={12} />
              </div>
            }
          >
            <BoardsCatalog
              initialBoards={initialBoards}
              platinumBoards={platinumBoards}
              vendors={vendors}
              total={total}
              tierCounts={tierCounts}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
