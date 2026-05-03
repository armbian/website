'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function PrivacyDisclaimer({ className }: { className?: string }) {
  const t = useTranslations('forms');
  return (
    <p
      className={
        className ?? 'text-[11px] leading-relaxed text-[rgb(var(--fg-3))]'
      }
    >
      {t.rich('privacy_disclaimer', {
        pp: (chunks) => (
          <Link
            href="/privacy"
            className="text-[rgb(var(--brand))] underline-offset-2 hover:underline"
          >
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
