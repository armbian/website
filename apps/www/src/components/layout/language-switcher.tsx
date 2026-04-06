'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { LOCALES, LOCALE_LABELS, LOCALE_COUNTRY_MAP } from '@armbian/config';
import { useRouter, usePathname } from '@/i18n/navigation';
import { ChevronDown } from 'lucide-react';

/** Get Twemoji CDN URL for a country code flag */
function getFlagUrl(countryCode: string): string {
  // Country code → regional indicator symbols → codepoints
  const codepoints = [...countryCode.toUpperCase()]
    .map((c) => (0x1f1e6 + c.charCodeAt(0) - 65).toString(16))
    .join('-');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codepoints}.svg`;
}

function FlagIcon({ locale, size = 18 }: { locale: string; size?: number }) {
  const country = LOCALE_COUNTRY_MAP[locale as keyof typeof LOCALE_COUNTRY_MAP];
  if (!country) return null;
  return (
    <img
      src={getFlagUrl(country)}
      alt=""
      width={size}
      height={size}
      className="inline-block"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

export function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(newLocale: string) {
    setOpen(false);
    try {
      localStorage.setItem('locale', newLocale);
      document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    } catch { /* SSR safety */ }
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] px-2.5 text-sm font-medium transition-colors hover:bg-[rgb(var(--bg-sub))]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language')}
      >
        <FlagIcon locale={locale} size={16} />
        {locale.toUpperCase()}
        <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] py-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => switchLocale(l)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[rgb(var(--bg-sub))] ${
                  l === locale ? 'font-semibold text-[rgb(var(--brand))]' : ''
                }`}
              >
                <FlagIcon locale={l} size={18} />
                {LOCALE_LABELS[l as keyof typeof LOCALE_LABELS] ?? l}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
