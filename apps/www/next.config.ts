import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withPayload } from '@payloadcms/next/withPayload';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@armbian/config',
    '@armbian/schemas',
    '@armbian/api-client',
    '@armbian/theme',
  ],
  serverExternalPackages: ['drizzle-kit'],
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://cdn.jsdelivr.net https://avatars.githubusercontent.com https://www.gravatar.com https://www.gstatic.com/recaptcha/ data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google.com",
              "frame-ancestors 'none'",
              "frame-src 'self' https://bigin.zoho.eu https://www.google.com/recaptcha/",
              "base-uri 'self'",
              "form-action 'self' https://bigin.zoho.eu",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Loaded by Next outside its bundler — can't import workspace packages here.
    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default withPayload(withNextIntl(config));
