import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('error');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-[rgb(var(--brand))]">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('not_found_title')}</h1>
      <p className="mt-2 text-[rgb(var(--fg-2))]">{t('not_found_message')}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[rgb(var(--brand))] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-hover))]"
      >
        {t('go_home')}
      </Link>
    </div>
  );
}
