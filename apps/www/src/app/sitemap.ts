import type { MetadataRoute } from 'next';
import { getPayload } from 'payload';
import config from '@payload-config';
import {
  LOCALES,
  DEFAULT_LOCALE,
  ARMBIAN_URLS,
  LEGAL_PAGES,
  DEFAULT_API_URL,
} from '@armbian/config';

const BASE_URL = ARMBIAN_URLS.WEBSITE;

// Build-time generation runs before the DB is seeded and before the API
// container is reachable on the production network, so a static sitemap
// generated at build is empty. Render dynamically — sitemaps are crawled
// rarely (once per day at most), so per-request rendering is fine.
export const dynamic = 'force-dynamic';

function localizedAlternates(path: string): MetadataRoute.Sitemap[0]['alternates'] {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = loc === DEFAULT_LOCALE ? `${BASE_URL}${path}` : `${BASE_URL}/${loc}${path}`;
  }
  return { languages };
}

interface BoardsResponse {
  data: { boards: { slug: string }[]; vendors: { slug: string }[] };
}

interface CmsPageDoc {
  slug?: string | null;
  updatedAt?: string | null;
}

async function fetchBoardsAndVendors(apiUrl: string): Promise<BoardsResponse | null> {
  try {
    const res = await fetch(`${apiUrl}/api/v1/pages/boards`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as BoardsResponse;
  } catch {
    return null;
  }
}

async function fetchCmsPages(): Promise<CmsPageDoc[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'pages',
      where: { status: { equals: 'published' } },
      limit: 200,
      depth: 0,
    });
    return result.docs as CmsPageDoc[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env['API_URL'] ?? DEFAULT_API_URL;
  const now = new Date();

  const [boardData, cmsDocs] = await Promise.all([fetchBoardsAndVendors(apiUrl), fetchCmsPages()]);

  const boardSlugs = boardData?.data.boards.map((b) => b.slug) ?? [];
  const vendorSlugs = boardData?.data.vendors.map((v) => v.slug) ?? [];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: localizedAlternates('/'),
    },
    {
      url: `${BASE_URL}/boards`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: localizedAlternates('/boards'),
    },
    {
      url: `${BASE_URL}/vendors`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: localizedAlternates('/vendors'),
    },
    {
      url: `${BASE_URL}/partners`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: localizedAlternates('/partners'),
    },
    {
      url: `${BASE_URL}/authors`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: localizedAlternates('/authors'),
    },
    {
      url: `${BASE_URL}/donate`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: localizedAlternates('/donate'),
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: localizedAlternates('/contact'),
    },
  ];

  const boardPages: MetadataRoute.Sitemap = boardSlugs.map((slug) => ({
    url: `${BASE_URL}/boards/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
    alternates: localizedAlternates(`/boards/${slug}`),
  }));

  const vendorPages: MetadataRoute.Sitemap = vendorSlugs.map((slug) => ({
    url: `${BASE_URL}/vendors/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: localizedAlternates(`/vendors/${slug}`),
  }));

  const canonicalLegalEntries: MetadataRoute.Sitemap = [];
  const cmsPageEntries: MetadataRoute.Sitemap = [];

  for (const doc of cmsDocs) {
    const slug = typeof doc.slug === 'string' ? doc.slug : '';
    if (!slug) continue;
    const lastModified = typeof doc.updatedAt === 'string' ? new Date(doc.updatedAt) : now;
    const canonical = LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];

    if (canonical) {
      canonicalLegalEntries.push({
        url: `${BASE_URL}${canonical}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: localizedAlternates(canonical),
      });
    } else {
      cmsPageEntries.push({
        url: `${BASE_URL}/p/${slug}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.3,
        alternates: localizedAlternates(`/p/${slug}`),
      });
    }
  }

  return [
    ...staticPages,
    ...boardPages,
    ...vendorPages,
    ...canonicalLegalEntries,
    ...cmsPageEntries,
  ];
}
