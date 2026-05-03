'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Cookie, X, ChevronDown } from 'lucide-react';
import { useConsent, writeConsent } from '@/lib/consent';

type DraftConsent = { functional: boolean };

export function CookieBanner() {
  const t = useTranslations('cookie_banner');
  const { consent, hydrated } = useConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState<DraftConsent>({ functional: false });

  function persist(input: DraftConsent) {
    writeConsent({ functional: input.functional });
    setShowDetails(false);
  }

  function acceptAll() {
    persist({ functional: true });
  }

  function essentialOnly() {
    persist({ functional: false });
  }

  function savePreferences() {
    persist(draft);
  }

  // Render only after hydration so SSR HTML matches the first client paint
  // (server has no localStorage and would always show the banner).
  if (!hydrated || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--brand)/0.12)] text-[rgb(var(--brand))] sm:flex">
            <Cookie size={20} strokeWidth={1.75} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2
                id="cookie-banner-title"
                className="text-sm font-bold tracking-tight sm:text-base"
              >
                {t('title')}
              </h2>
              <button
                type="button"
                onClick={essentialOnly}
                aria-label={t('close')}
                className="-mt-1 -mr-1 rounded-md p-1 text-[rgb(var(--fg-3))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))] sm:hidden"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-[rgb(var(--fg-2))] sm:text-sm">
              {t('description')}{' '}
              <Link
                href="/privacy"
                className="font-medium text-[rgb(var(--brand))] underline-offset-2 hover:underline"
              >
                {t('read_more')}
              </Link>
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3 border-t border-[rgb(var(--border))] pt-4">
                <CategoryRow
                  title={t('category_necessary')}
                  description={t('category_necessary_desc')}
                  alwaysOnLabel={t('always_on')}
                  required
                  checked
                />
                <CategoryRow
                  title={t('category_functional')}
                  description={t('category_functional_desc')}
                  checked={draft.functional}
                  onChange={(v) => setDraft({ ...draft, functional: v })}
                />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--brand))] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[rgb(var(--brand-hover))] sm:text-sm"
              >
                {t('accept_all')}
              </button>
              <button
                type="button"
                onClick={essentialOnly}
                className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-xs font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))] sm:text-sm"
              >
                {t('essential_only')}
              </button>
              {showDetails ? (
                <button
                  type="button"
                  onClick={savePreferences}
                  className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--brand))] px-4 py-2 text-xs font-bold text-[rgb(var(--brand))] transition-colors hover:bg-[rgb(var(--brand)/0.08)] sm:text-sm"
                >
                  {t('save')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-[rgb(var(--fg-3))] transition-colors hover:text-[rgb(var(--fg))] sm:text-sm sm:ml-auto"
                >
                  {t('customize')}
                  <ChevronDown size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  required?: boolean;
  alwaysOnLabel?: string;
  onChange?: (value: boolean) => void;
}

function CategoryRow({
  title,
  description,
  checked,
  required = false,
  alwaysOnLabel,
  onChange,
}: CategoryRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-tight sm:text-sm">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[rgb(var(--fg-3))] sm:text-xs">
          {description}
        </p>
      </div>
      {required ? (
        <span className="shrink-0 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-sub))] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))]">
          {alwaysOnLabel}
        </span>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          onClick={() => onChange?.(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            checked
              ? 'bg-[rgb(var(--brand))]'
              : 'bg-[rgb(var(--bg-sub))] border border-[rgb(var(--border))]'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      )}
    </div>
  );
}
