import type { MetadataRoute } from 'next';
import { ARMBIAN_URLS } from '@armbian/config';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${ARMBIAN_URLS.IMAGER}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
