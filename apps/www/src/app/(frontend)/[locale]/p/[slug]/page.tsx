import { notFound, permanentRedirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LEGAL_PAGES, type LegalSlug } from '@armbian/config';
import { CmsPageBody, loadCmsPage } from '@/lib/cms-page';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadCmsPage(slug);
  if (!page) return { title: 'Not Found' };
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
  };
}

export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params;

  if (slug in LEGAL_PAGES) {
    permanentRedirect(LEGAL_PAGES[slug as LegalSlug]);
  }

  setRequestLocale(locale);

  const page = await loadCmsPage(slug);
  if (!page) notFound();

  return <CmsPageBody title={page.title} htmlContent={page.htmlContent} />;
}
