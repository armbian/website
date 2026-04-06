/** All supported locales — single source of truth */
export const LOCALES = ['en', 'de', 'zh', 'fr', 'es', 'it', 'ru', 'pt', 'ja', 'ko', 'nl', 'pl', 'tr', 'uk', 'hr', 'sl', 'sv'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Domain-to-locale forcing map (RULE-I18N-003) */
export const DOMAIN_LOCALE_MAP: Record<string, Locale> = {
  'armbian.cn': 'zh',
  'armbian.de': 'de',
};

/** Set of valid locale codes for fast lookup */
export const LOCALE_SET = new Set<string>(LOCALES);

/** Human-readable locale labels in their native language */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  zh: '中文',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  ru: 'Русский',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  uk: 'Українська',
  hr: 'Hrvatski',
  sl: 'Slovenščina',
  sv: 'Svenska',
};

/** Locale → ISO 3166-1 country code for flags */
export const LOCALE_COUNTRY_MAP: Record<Locale, string> = {
  en: 'GB',
  de: 'DE',
  zh: 'CN',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  ru: 'RU',
  pt: 'PT',
  ja: 'JP',
  ko: 'KR',
  nl: 'NL',
  pl: 'PL',
  tr: 'TR',
  uk: 'UA',
  hr: 'HR',
  sl: 'SI',
  sv: 'SE',
};
