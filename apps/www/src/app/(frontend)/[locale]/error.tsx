'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-black text-red-500">500</p>
      <h1 className="mt-4 text-2xl font-bold">{t('generic_title')}</h1>
      <p className="mt-2 text-[rgb(var(--fg-2))]">{t('generic_message')}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-[rgb(var(--brand))] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-hover))]"
      >
        {t('retry')}
      </button>
    </div>
  );
}
