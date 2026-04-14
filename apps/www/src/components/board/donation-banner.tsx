'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ARMBIAN_URLS } from '@armbian/config';
import { Heart, X } from 'lucide-react';

const STORAGE_KEY = 'armbian_donation_dismissed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_KEY = 'armbian_donation_shown';
const SHOW_DELAY_MS = 1500;

/** Dispatch this event from any download link to trigger the banner. */
export const DOWNLOAD_EVENT = 'armbian:download';

export function DonationBanner() {
  const t = useTranslations('donation');
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => {
    // Don't show twice in the same session
    if (sessionStorage.getItem(SESSION_KEY)) return;
    // Don't show if dismissed within cooldown
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < COOLDOWN_MS) return;

    setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(true);
    }, SHOW_DELAY_MS);
  }, []);

  useEffect(() => {
    function handleDownload() {
      show();
    }
    window.addEventListener(DOWNLOAD_EVENT, handleDownload);
    return () => window.removeEventListener(DOWNLOAD_EVENT, handleDownload);
  }, [show]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] p-8 shadow-2xl animate-scale-in"
          role="dialog"
          aria-label={t('title')}
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-sub))] transition-colors"
            aria-label={t('close')}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--brand)/0.1)] flex items-center justify-center mx-auto mb-5">
              <Heart size={26} strokeWidth={1.5} className="text-[rgb(var(--brand))]" />
            </div>
            <h3 className="text-lg font-bold mb-2">{t('title')}</h3>
            <p className="text-sm text-[rgb(var(--fg-2))] leading-relaxed mb-6">{t('message')}</p>
            <div className="flex flex-col gap-2.5">
              <a
                href={ARMBIAN_URLS.DONATE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--brand))] px-5 py-3 text-sm font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-all shadow-lg shadow-[rgb(var(--brand)/0.25)]"
              >
                {t('donate')}
              </a>
              <a
                href={ARMBIAN_URLS.GITHUB_SPONSORS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))] px-5 py-3 text-sm font-medium hover:bg-[rgb(var(--bg-sub))] transition-all"
              >
                {t('sponsor')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
