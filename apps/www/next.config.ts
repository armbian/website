import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withPayload } from '@payloadcms/next/withPayload';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@armbian/config', '@armbian/schemas', '@armbian/api-client', '@armbian/theme'],
  serverExternalPackages: ['drizzle-kit'],
  images: { unoptimized: true },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ],
    }];
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${process.env['API_URL'] ?? 'http://localhost:3001'}/api/v1/:path*` },
    ];
  },
};

export default withPayload(withNextIntl(config));
