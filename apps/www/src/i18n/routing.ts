import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE, DOMAIN_LOCALE_MAP } from '@armbian/config';

/**
 * Country-TLD domains force a single locale on every page served there
 * (e.g. armbian.cn always renders Chinese). The main armbian.com keeps
 * the default English locale and lets every other translation be reached
 * via `/<locale>` prefixes.
 */
const forcedDomains = Object.entries(DOMAIN_LOCALE_MAP).map(([domain, locale]) => ({
  domain,
  defaultLocale: locale,
  locales: [locale],
}));

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  domains: [
    { domain: 'armbian.com', defaultLocale: DEFAULT_LOCALE, locales: [...LOCALES] },
    ...forcedDomains,
  ],
});
