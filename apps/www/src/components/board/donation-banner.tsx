'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ARMBIAN_URLS } from '@armbian/config';
import { X } from 'lucide-react';

const STORAGE_KEY = 'armbian_donation_dismissed';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const SHOW_DELAY_MS = 2000;

export function DonationBanner() {
  const t = useTranslations('donation');
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < COOLDOWN_MS) {
      return;
    }
    setTimeout(() => setVisible(true), SHOW_DELAY_MS);
  }, []);

  // Listen for download clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href]');
      if (anchor) {
        const href = anchor.getAttribute('href') ?? '';
        if (href.includes('.img.xz') || href.includes('dl.armbian.com')) {
          show();
        }
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [show]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] p-4 shadow-lg sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:rounded-lg sm:border"
      role="complementary"
      aria-label={t('title')}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold">{t('title')}</p>
          <p className="mt-1 text-xs text-[rgb(var(--fg-2))]">
            {t('message')}
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href={ARMBIAN_URLS.DONATE}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-[rgb(var(--brand))] px-3 py-1.5 text-xs font-medium text-white hover:bg-[rgb(var(--brand-hover))]"
            >
              {t('donate')}
            </a>
            <a
              href={ARMBIAN_URLS.GITHUB_SPONSORS}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-medium hover:bg-[rgb(var(--bg-sub))]"
            >
              {t('sponsor')}
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))]"
          aria-label={t('close')}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
