import { cache } from 'react';
import { getPayload } from 'payload';
import config from '@payload-config';
import { sanitizeCmsHtml } from '@/lib/sanitize';
import { PageHero } from '@/components/layout/page-hero';

interface LoadedCmsPage {
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  htmlContent: string;
}

/**
 * Fetch a published CMS page by slug and convert its Lexical content to
 * sanitized HTML. Returns null if the page is missing or if Payload is
 * unreachable, so callers can map to notFound() without leaking errors.
 *
 * Wrapped in React.cache so generateMetadata + the page handler share a
 * single fetch + Lexical conversion per request.
 */
export const loadCmsPage = cache(async (slug: string): Promise<LoadedCmsPage | null> => {
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
    if (!page) return null;

    let htmlContent = '';
    if (page.content && typeof page.content === 'object') {
      const { convertLexicalToHTMLAsync, defaultHTMLConvertersAsync } =
        await import('@payloadcms/richtext-lexical/html-async');
      htmlContent = await convertLexicalToHTMLAsync({
        converters: defaultHTMLConvertersAsync,
        data: page.content as Parameters<typeof convertLexicalToHTMLAsync>[0]['data'],
      });
    }

    return {
      title: String(page.title ?? ''),
      metaTitle: typeof page.metaTitle === 'string' ? page.metaTitle : null,
      metaDescription: typeof page.metaDescription === 'string' ? page.metaDescription : null,
      htmlContent,
    };
  } catch {
    return null;
  }
});

export function CmsPageBody({ title, htmlContent }: { title: string; htmlContent: string }) {
  return (
    <div>
      <PageHero>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-fluid-3xl font-black tracking-tight">{title}</h1>
        </div>
      </PageHero>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <article
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:tracking-tight prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-[rgb(var(--fg-2))] prose-h3:mt-7 prose-h3:mb-2 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-[rgb(var(--brand))] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(htmlContent) }}
        />
      </div>
    </div>
  );
}
