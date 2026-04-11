import type { MetadataRoute } from 'next';
import { LOCALES, DEFAULT_LOCALE, ARMBIAN_URLS } from '@armbian/config';

const BASE_URL = ARMBIAN_URLS.WEBSITE;

function localizedAlternates(path: string): MetadataRoute.Sitemap[0]['alternates'] {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = loc === DEFAULT_LOCALE ? `${BASE_URL}${path}` : `${BASE_URL}/${loc}${path}`;
  }
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';

  let boardSlugs: string[] = [];
  let vendorSlugs: string[] = [];
  try {
    const res = await fetch(`${apiUrl}/api/v1/pages/boards`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = (await res.json()) as {
        data: { boards: { slug: string }[]; vendors: { slug: string }[] };
      };
      boardSlugs = json.data.boards.map((b) => b.slug);
      vendorSlugs = json.data.vendors.map((v) => v.slug);
    }
  } catch {
    /* graceful */
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: localizedAlternates('/'),
    },
    {
      url: `${BASE_URL}/boards`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: localizedAlternates('/boards'),
    },
    {
      url: `${BASE_URL}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: localizedAlternates('/vendors'),
    },
    {
      url: `${BASE_URL}/partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: localizedAlternates('/partners'),
    },
    {
      url: `${BASE_URL}/authors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: localizedAlternates('/authors'),
    },
    {
      url: `${BASE_URL}/donate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: localizedAlternates('/donate'),
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: localizedAlternates('/contact'),
    },
  ];

  const boardPages: MetadataRoute.Sitemap = boardSlugs.map((slug) => ({
    url: `${BASE_URL}/boards/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
    alternates: localizedAlternates(`/boards/${slug}`),
  }));

  const vendorPages: MetadataRoute.Sitemap = vendorSlugs.map((slug) => ({
    url: `${BASE_URL}/vendors/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: localizedAlternates(`/vendors/${slug}`),
  }));

  return [...staticPages, ...boardPages, ...vendorPages];
}
