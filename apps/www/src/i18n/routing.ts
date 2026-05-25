import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE, DOMAIN_LOCALE_MAP, PRIMARY_DOMAIN } from '@armbian/config';

const DOMAIN_ROUTING_ENABLED = process.env['NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING'] === 'true';

const baseConfig = {
  locales: [...LOCALES] as const,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed' as const,
  localeDetection: false,
};

// Per next-intl docs: when using domains with as-needed prefix, each
// locale must be assigned to exactly ONE domain. Forced domains own
// their single locale exclusively; the primary domain gets the rest.
const forcedLocales = new Set(Object.values(DOMAIN_LOCALE_MAP));
const primaryLocales = LOCALES.filter((l) => !forcedLocales.has(l));

const primaryDefaultLocale = (DOMAIN_LOCALE_MAP[PRIMARY_DOMAIN] ??
  DEFAULT_LOCALE) as (typeof LOCALES)[number];

export const routing = DOMAIN_ROUTING_ENABLED
  ? defineRouting({
      ...baseConfig,
      domains: [
        {
          domain: PRIMARY_DOMAIN,
          defaultLocale: primaryDefaultLocale,
          locales: [...primaryLocales],
        },
        ...Object.entries(DOMAIN_LOCALE_MAP)
          .filter(([domain]) => domain !== PRIMARY_DOMAIN)
          .map(([domain, locale]) => ({
            domain,
            defaultLocale: locale as (typeof LOCALES)[number],
            locales: [locale as (typeof LOCALES)[number]],
          })),
      ],
    })
  : defineRouting(baseConfig);
