'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ARMBIAN_URLS } from '@armbian/config';
import { PrivacyDisclaimer } from '@/components/forms/privacy-disclaimer';

// Minimal grecaptcha surface we interact with. The full API is loaded
// asynchronously by the Google script tag at runtime.
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement,
        params: { sitekey: string; theme?: 'light' | 'dark' },
      ) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

interface ContactFormProps {
  tokens: {
    xnQsjsdp: string;
    xmIwtLD: string;
    actionType: string;
    recaptchaSiteKey: string;
  } | null;
}

export function ContactForm({ tokens }: ContactFormProps) {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [captchaError, setCaptchaError] = useState(false);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Render the reCAPTCHA widget explicitly (instead of relying on the
  // auto-render from `.g-recaptcha`) so we can pass the current theme. The
  // widget re-renders whenever the user toggles dark mode: reCAPTCHA has no
  // API to change the theme of an existing widget, and trying to call
  // `grecaptcha.render` twice on the same DOM element fails silently. We
  // work around it by mounting each widget into a brand new child element
  // that Google has never seen before.
  useEffect(() => {
    let cancelled = false;
    let lastTheme: 'light' | 'dark' | null = null;

    const renderWidget = () => {
      if (cancelled || !captchaContainerRef.current || !window.grecaptcha) return;
      const theme = isDarkTheme() ? 'dark' : 'light';
      if (theme === lastTheme && widgetIdRef.current !== null) return;
      lastTheme = theme;

      // Replace the container's child with a fresh div each time so
      // grecaptcha.render() always sees a pristine element.
      const fresh = document.createElement('div');
      captchaContainerRef.current.replaceChildren(fresh);
      try {
        widgetIdRef.current = window.grecaptcha.render(fresh, {
          sitekey: tokens?.recaptchaSiteKey ?? '',
          theme,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('reCAPTCHA render failed', err);
      }
    };

    const waitForApi = () => {
      if (cancelled) return;
      if (window.grecaptcha) {
        window.grecaptcha.ready(renderWidget);
      } else {
        setTimeout(waitForApi, 150);
      }
    };
    waitForApi();

    // Re-render on theme toggle. The MutationObserver fires for every
    // attribute mutation on <html>, so renderWidget() guards against
    // unrelated changes via the lastTheme comparison.
    const observer = new MutationObserver(renderWidget);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  // Reset the reCAPTCHA widget whenever we return to the idle state so the
  // next submission requires a fresh token (the response is single-use).
  useEffect(() => {
    if (status !== 'idle') return;
    if (typeof window === 'undefined' || !window.grecaptcha) return;
    if (widgetIdRef.current === null) return;
    try {
      window.grecaptcha.reset(widgetIdRef.current);
    } catch {
      /* widget not mounted yet */
    }
  }, [status]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const token =
      typeof window !== 'undefined' && window.grecaptcha && widgetIdRef.current !== null
        ? window.grecaptcha.getResponse(widgetIdRef.current)
        : '';

    if (!token) {
      e.preventDefault();
      setCaptchaError(true);
      return;
    }

    setCaptchaError(false);
    setStatus('sending');
    // Optimistic fallback: if the hidden iframe never fires onLoad (cross
    // origin can silently fail), flip to success after a short delay so the
    // user gets feedback.
    setTimeout(() => setStatus((s) => (s === 'sending' ? 'success' : s)), 3000);
  }

  function handleIframeLoad() {
    if (status === 'sending') setStatus('success');
  }

  if (!tokens) {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={28} strokeWidth={1.5} className="text-amber-400" />
        </div>
        <p className="text-sm text-[rgb(var(--fg-3))]">
          {t('form_unavailable', { email: ARMBIAN_URLS.INFO_EMAIL })}
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={28} strokeWidth={1.5} className="text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold mb-2">{t('form_success_title')}</h3>
        <p className="text-sm text-[rgb(var(--fg-3))]">{t('form_success_message')}</p>
      </div>
    );
  }

  const inputClass = [
    'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-sub))]',
    'px-4 py-3.5 text-sm outline-none transition-all',
    'placeholder:text-[rgb(var(--fg-3))]',
    'focus:border-[rgb(var(--brand)/0.5)] focus:ring-1 focus:ring-[rgb(var(--brand)/0.2)]',
    'hover:border-[rgb(var(--fg-3))]',
  ].join(' ');

  return (
    <>
      <Script
        src={`${ARMBIAN_URLS.RECAPTCHA_SCRIPT}?render=explicit`}
        strategy="afterInteractive"
      />
      <iframe name="biginHiddenFrame" className="hidden" onLoad={handleIframeLoad} />
      <form
        method="POST"
        action={ARMBIAN_URLS.BIGIN_FORM}
        target="biginHiddenFrame"
        acceptCharset="UTF-8"
        onSubmit={handleSubmit}
        className="space-y-5 flex-1 flex flex-col"
      >
        <input type="hidden" name="xnQsjsdp" value={tokens?.xnQsjsdp ?? ''} />
        <input type="hidden" name="zc_gad" value="" />
        <input type="hidden" name="xmIwtLD" value={tokens?.xmIwtLD ?? ''} />
        <input type="hidden" name="actionType" value={tokens?.actionType ?? ''} />
        <input type="hidden" name="rmsg" value="true" />
        <input type="hidden" name="returnURL" value="null" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2">
              {t('form_first_name')} <span className="text-[rgb(var(--brand))]">*</span>
            </label>
            <input
              type="text"
              name="First Name"
              maxLength={40}
              required
              className={inputClass}
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2">
              {t('form_last_name')} <span className="text-[rgb(var(--brand))]">*</span>
            </label>
            <input
              type="text"
              name="Last Name"
              maxLength={80}
              required
              className={inputClass}
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2">
              {t('form_company')} <span className="text-[rgb(var(--brand))]">*</span>
            </label>
            <input
              type="text"
              name="Accounts.Account Name"
              maxLength={200}
              required
              className={inputClass}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2">
              {t('form_email')} <span className="text-[rgb(var(--brand))]">*</span>
            </label>
            <input
              type="email"
              name="Email"
              maxLength={100}
              required
              className={inputClass}
              placeholder="john@acme.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2">
            {t('form_message')} <span className="text-[rgb(var(--brand))]">*</span>
          </label>
          <textarea
            name="CONTACTCF7"
            maxLength={2000}
            rows={4}
            required
            className={`${inputClass} resize-none min-h-[140px] flex-1 overflow-y-auto`}
            placeholder={t('form_message_placeholder')}
          />
        </div>

        <PrivacyDisclaimer className="pt-2 text-[11px] leading-relaxed text-[rgb(var(--fg-3))]" />

        <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-1.5">
            <div ref={captchaContainerRef} />
            {captchaError && (
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-400">
                <AlertCircle size={13} strokeWidth={2} />
                {t('form_captcha_error')}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[rgb(var(--brand))] px-7 py-3 text-sm font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-all shadow-lg shadow-[rgb(var(--brand)/0.25)] disabled:opacity-50 disabled:shadow-none"
          >
            {status === 'sending' ? (
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <Send size={16} strokeWidth={2} />
            )}
            {t('form_submit')}
          </button>
        </div>
      </form>
    </>
  );
}
