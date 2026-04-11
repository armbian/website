import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { PageHero } from '@/components/layout/page-hero';
import { sanitizeCmsHtml } from '@/lib/sanitize';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
      },
      limit: 1,
    });

    const page = result.docs[0];
    if (!page) return { title: 'Not Found' };

    return {
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
    };
  } catch {
    return { title: 'Not Found' };
  }
}

export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let page;
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
      },
      limit: 1,
    });
    page = result.docs[0];
  } catch {
    notFound();
  }

  if (!page) notFound();

  let htmlContent = '';
  if (page.content && typeof page.content === 'object') {
    const { convertLexicalToHTMLAsync, defaultHTMLConvertersAsync } =
      await import('@payloadcms/richtext-lexical/html-async');
    htmlContent = await convertLexicalToHTMLAsync({
      converters: defaultHTMLConvertersAsync,
      data: page.content as any,
    });
  }

  return (
    <div>
      <PageHero>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-fluid-3xl font-black tracking-tight">{page.title}</h1>
        </div>
      </PageHero>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <article
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-[rgb(var(--brand))] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(htmlContent) }}
        />
      </div>
    </div>
  );
}
