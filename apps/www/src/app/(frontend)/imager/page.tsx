import type { Metadata } from 'next';
import { ARMBIAN_URLS, cleanVendorName } from '@armbian/config';
import { getApiClient } from '@/lib/api.server';
import { Hero } from './_components/sections/hero';
import { Preview } from './_components/sections/preview';
import { Features } from './_components/sections/features';
import { HowItWorks } from './_components/sections/how-it-works';
import { Downloads } from './_components/sections/downloads';
import { Testimonials } from './_components/sections/testimonials';
import { Community } from './_components/sections/community';
import { SectionErrorBoundary } from './_components/section-error-boundary';
import { siteMetadata } from './_content/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.url),
  title: siteMetadata.title,
  description: siteMetadata.description,
  alternates: { canonical: siteMetadata.url },
  openGraph: {
    type: 'website',
    siteName: 'Armbian Imager',
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.url,
    locale: 'en_US',
    images: [{ url: siteMetadata.ogImage, width: 1200, height: 630, alt: siteMetadata.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [siteMetadata.ogImage],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Armbian Imager',
    description: siteMetadata.description,
    url: siteMetadata.url,
    operatingSystem: 'Windows, macOS, Linux',
    applicationCategory: 'DeveloperApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: `${ARMBIAN_URLS.IMAGER_GITHUB}/releases/latest`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Armbian',
    url: ARMBIAN_URLS.WEBSITE,
    logo: `${siteMetadata.url}/icon-512.png`,
    sameAs: [ARMBIAN_URLS.GITHUB_ORG, ARMBIAN_URLS.FORUM, ARMBIAN_URLS.DISCORD],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Armbian Imager',
    url: siteMetadata.url,
    description: siteMetadata.description,
  },
];

const FALLBACK_VENDORS = ['Raspberry Pi', 'Orange Pi', 'Banana Pi', 'Radxa', 'Khadas', 'NanoPi'];

export default async function ImagerPage() {
  const api = await getApiClient();

  let boardsWithImages: { slug: string; name: string; image_url: string }[] = [];
  let stats = { boards: 300, vendors: 70 };
  let topVendors: string[] = FALLBACK_VENDORS;

  try {
    const { data: home } = await api.getHomePage();
    const { platinum_boards, promoted_boards, stats: apiStats } = home;
    const platSlugs = new Set(platinum_boards.map((b) => b.slug));
    const others = promoted_boards.filter((b) => !platSlugs.has(b.slug));
    boardsWithImages = [...platinum_boards, ...others]
      .filter((b) => b.image_url)
      .map((b) => ({ slug: b.slug, name: b.name, image_url: b.image_url! }));
    stats = { boards: apiStats.boards, vendors: apiStats.vendors };

    const seen = new Set<string>();
    const names: string[] = [];
    for (const b of platinum_boards) {
      const name = cleanVendorName(b.vendor_slug, b.vendor_name);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
      if (names.length >= 6) break;
    }
    if (names.length >= 3) topVendors = names;
  } catch {
    // Fallbacks above keep the page renderable when the API is down.
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero boards={boardsWithImages} stats={stats} />
      <div className="divider-glow w-full pointer-events-none" />
      <Preview />
      <div className="divider-glow w-full pointer-events-none" />
      <Features vendors={topVendors} totalVendors={stats.vendors} totalBoards={stats.boards} />
      <div className="divider-glow w-full pointer-events-none" />
      <HowItWorks />
      <div className="divider-glow w-full pointer-events-none" />
      <SectionErrorBoundary sectionName="Downloads">
        <Downloads />
      </SectionErrorBoundary>
      <div className="divider-glow w-full pointer-events-none" />
      <Testimonials />
      <div className="divider-glow w-full pointer-events-none" />
      <Community />
    </>
  );
}
