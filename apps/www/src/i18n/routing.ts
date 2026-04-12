import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE, DOMAIN_LOCALE_MAP } from '@armbian/config';

const DOMAIN_ROUTING_ENABLED = process.env['NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING'] === 'true';

const primaryDomain = process.env['NEXT_PUBLIC_PRIMARY_DOMAIN'] ?? 'armbian.com';

const baseConfig = {
  locales: [...LOCALES] as const,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed' as const,
};

const primaryDefaultLocale = (DOMAIN_LOCALE_MAP[primaryDomain] ??
  DEFAULT_LOCALE) as (typeof LOCALES)[number];

export const routing = DOMAIN_ROUTING_ENABLED
  ? defineRouting({
      ...baseConfig,
      domains: [
        { domain: primaryDomain, defaultLocale: primaryDefaultLocale, locales: [...LOCALES] },
        ...Object.entries(DOMAIN_LOCALE_MAP)
          .filter(([domain]) => domain !== primaryDomain)
          .map(([domain, locale]) => ({
            domain,
            defaultLocale: locale as (typeof LOCALES)[number],
            locales: [locale as (typeof LOCALES)[number]],
          })),
      ],
    })
  : defineRouting(baseConfig);
