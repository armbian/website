import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CmsPageBody, loadCmsPage } from '@/lib/cms-page';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const SLUG = 'terms';
const TITLE_KEY = 'link_terms';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    loadCmsPage(SLUG),
    getTranslations({ locale, namespace: 'footer' }),
  ]);
  if (!page) return { title: 'Not Found' };
  return {
    title: t(TITLE_KEY),
    description: page.metaDescription ?? undefined,
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [page, t] = await Promise.all([
    loadCmsPage(SLUG),
    getTranslations({ locale, namespace: 'footer' }),
  ]);
  if (!page) notFound();

  return <CmsPageBody title={t(TITLE_KEY)} htmlContent={page.htmlContent} />;
}
