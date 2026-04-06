import type { MetadataRoute } from 'next';
import { ARMBIAN_URLS } from '@armbian/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${ARMBIAN_URLS.WEBSITE}/sitemap.xml`,
  };
}
