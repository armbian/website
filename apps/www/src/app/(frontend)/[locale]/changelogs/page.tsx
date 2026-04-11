import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Link } from '@/i18n/navigation';
import { Download, ExternalLink, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'changelogs' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function ChangelogsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('changelogs');

  let changelogs: any[] = [];
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'changelogs',
      where: { status: { equals: 'published' } },
      sort: '-releaseDate',
      limit: 50,
    });
    changelogs = result.docs;
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
                {t('title')}
              </h1>
              <p className="text-fluid-lg text-[rgb(var(--fg-2))] leading-relaxed">
                {t('subtitle')}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
        {changelogs.length === 0 ? (
          <p className="text-center text-sm text-[rgb(var(--fg-3))] py-16">
            No releases published yet.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[rgb(var(--border)/0.3)]" />

            {changelogs.map((entry, i) => {
              const date = new Date(entry.releaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              return (
                <ScrollReveal key={entry.id} delay={Math.min(i * 0.05, 0.3)} distance={20}>
                  <div className="relative pl-10 pb-10">
                    <div
                      className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${entry.major ? 'bg-[rgb(var(--brand))] border-[rgb(var(--brand))]' : 'bg-[rgb(var(--bg))] border-[rgb(var(--border))]'}`}
                    />

                    <Link
                      href={`/changelogs/${encodeURIComponent(entry.version)}`}
                      className="group block rounded-xl border border-[rgb(var(--border)/0.4)] bg-[rgb(var(--bg-el)/0.2)] p-5 transition-all duration-300 hover:border-[rgb(var(--brand)/0.3)] hover:bg-[rgb(var(--bg-el)/0.5)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold group-hover:text-[rgb(var(--brand))] transition-colors">
                            {entry.version}
                          </h2>
                          {entry.major && (
                            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[rgb(var(--brand))] bg-[rgb(var(--brand)/0.1)] px-2 py-0.5 rounded-full">
                              {t('major_release')}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[rgb(var(--fg-3))] font-mono shrink-0">
                          {date}
                        </span>
                      </div>

                      <p className="text-sm text-[rgb(var(--fg-2))] leading-relaxed mb-3">
                        {entry.summary}
                      </p>

                      <div className="flex items-center gap-4">
                        {entry.downloadUrl && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[rgb(var(--fg-3))]">
                            <Download size={10} strokeWidth={2} /> {t('download')}
                          </span>
                        )}
                        {entry.githubUrl && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[rgb(var(--fg-3))]">
                            <ExternalLink size={10} strokeWidth={2} /> GitHub
                          </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--brand))] opacity-0 group-hover:opacity-100 transition-opacity">
                          Read more <ArrowRight size={10} strokeWidth={2.5} />
                        </span>
                      </div>
                    </Link>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
