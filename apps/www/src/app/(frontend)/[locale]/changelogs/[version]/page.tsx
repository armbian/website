import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { sanitizeCmsHtml } from '@/lib/sanitize';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; version: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  const decoded = decodeURIComponent(version);
  return { title: `${decoded} — Armbian Changelog` };
}

export default async function ChangelogDetailPage({ params }: Props) {
  const { locale, version } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('changelogs');
  const decoded = decodeURIComponent(version);

  let entry;
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'changelogs',
      where: {
        and: [
          { version: { equals: decoded } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
    });
    entry = result.docs[0];
  } catch {
    notFound();
  }

  if (!entry) notFound();

  let htmlContent = '';
  if (entry.content && typeof entry.content === 'object') {
    const { convertLexicalToHTMLAsync, defaultHTMLConvertersAsync } =
      await import('@payloadcms/richtext-lexical/html-async');
    htmlContent = sanitizeCmsHtml(
      await convertLexicalToHTMLAsync({ converters: defaultHTMLConvertersAsync, data: entry.content as any }),
    );
  }

  const date = new Date(entry.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <PageHero>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <Link href="/changelogs" className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors mb-6">
              <ArrowLeft size={12} strokeWidth={2} />
              {t('back')}
            </Link>
            <h1 className="text-fluid-2xl font-black tracking-tight mb-2">{entry.version}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-[rgb(var(--fg-2))] font-mono">{date}</span>
              {entry.major && (
                <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[rgb(var(--brand))] bg-[rgb(var(--brand)/0.1)] px-2 py-0.5 rounded-full">
                  {t('major_release')}
                </span>
              )}
            </div>
            {(entry.downloadUrl || entry.githubUrl) && (
              <div className="flex items-center gap-3 mt-4">
                {entry.downloadUrl && (
                  <a href={entry.downloadUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--brand))] px-4 py-2 text-xs font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-colors">
                    <Download size={12} strokeWidth={2.5} />
                    {t('download')}
                  </a>
                )}
                {entry.githubUrl && (
                  <a href={entry.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-xs font-bold text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sub))] transition-colors">
                    <ExternalLink size={12} strokeWidth={2} />
                    {t('github_release')}
                  </a>
                )}
              </div>
            )}
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-[rgb(var(--brand))] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
