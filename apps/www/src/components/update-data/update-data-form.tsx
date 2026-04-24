'use client';

import { useState, useRef, useEffect, type FormEvent, type ReactNode } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import {
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  User,
  Eye,
  Wallet,
  Phone,
  MapPin,
  Mail,
  AtSign,
  Smartphone,
  Building2,
} from 'lucide-react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { ARMBIAN_URLS, CORE_COMPETENCES, CORE_COMPETENCE_I18N_KEYS } from '@armbian/config';
import { MultiSelect } from './multi-select';

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

interface UpdateDataFormProps {
  tokens: {
    xnQsjsdp: string;
    xmIwtLD: string;
    actionType: string;
    recaptchaSiteKey: string;
  } | null;
}

const inputBase = [
  'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-sub))]',
  'px-4 py-3 text-sm outline-none transition-all',
  'placeholder:text-[rgb(var(--fg-3))]',
  'focus:border-[rgb(var(--brand)/0.6)] focus:ring-2 focus:ring-[rgb(var(--brand)/0.15)]',
  'hover:border-[rgb(var(--fg-3))]',
].join(' ');
const inputWithIcon = `${inputBase} pl-10`;
const labelClass =
  'block text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2';
const helpClass = 'mt-1.5 text-[11px] text-[rgb(var(--fg-3))] leading-relaxed';

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[rgb(var(--brand)/0.12)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h3 className="text-sm font-bold tracking-wide">{title}</h3>
    </div>
  );
}

function InputWithIcon({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--fg-3))] pointer-events-none">
        {icon}
      </span>
      <input {...props} className={className ? `${inputWithIcon} ${className}` : inputWithIcon} />
    </div>
  );
}

export function UpdateDataForm({ tokens }: UpdateDataFormProps) {
  const t = useTranslations('update_data');
  const tComp = useTranslations('update_data.competences');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [captchaError, setCaptchaError] = useState(false);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Render reCAPTCHA widget explicitly so it matches the current theme and
  // re-renders on dark-mode toggle. Mirrors the contact form pattern.
  useEffect(() => {
    let cancelled = false;
    let lastTheme: 'light' | 'dark' | null = null;

    const renderWidget = () => {
      if (cancelled || !captchaContainerRef.current || !window.grecaptcha) return;
      const theme = isDarkTheme() ? 'dark' : 'light';
      if (theme === lastTheme && widgetIdRef.current !== null) return;
      lastTheme = theme;

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

  const competenceOptions = CORE_COMPETENCES.map((value) => ({
    value,
    label: tComp(CORE_COMPETENCE_I18N_KEYS[value]),
  }));

  const mkIcon = (Icon: typeof User) => (
    <Icon size={14} strokeWidth={2} className="text-[rgb(var(--brand))]" />
  );
  const mkInlineIcon = (Icon: typeof Mail) => <Icon size={15} strokeWidth={1.75} />;

  return (
    <>
      <Script
        src={`${ARMBIAN_URLS.RECAPTCHA_SCRIPT}?render=explicit`}
        strategy="afterInteractive"
      />
      <iframe name="updateDataHiddenFrame" className="hidden" onLoad={handleIframeLoad} />
      <form
        method="POST"
        action={ARMBIAN_URLS.UPDATE_DATA_FORM}
        target="updateDataHiddenFrame"
        acceptCharset="UTF-8"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8"
      >
        <input type="hidden" name="xnQsjsdp" value={tokens.xnQsjsdp} />
        <input type="hidden" name="zc_gad" value="" />
        <input type="hidden" name="xmIwtLD" value={tokens.xmIwtLD} />
        <input type="hidden" name="actionType" value={tokens.actionType} />
        <input type="hidden" name="rmsg" value="true" />
        <input type="hidden" name="returnURL" value="null" />

        <div className="space-y-8">
          <section className="space-y-4">
            <SectionHeader icon={mkIcon(User)} title={t('section_identity')} />
            <div>
              <label className={labelClass} htmlFor="ud-email">
                {t('form_email')} <span className="text-[rgb(var(--brand))]">*</span>
              </label>
              <InputWithIcon
                icon={mkInlineIcon(Mail)}
                id="ud-email"
                type="email"
                name="Email"
                maxLength={100}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="ud-last">
                  {t('form_last_name')} <span className="text-[rgb(var(--brand))]">*</span>
                </label>
                <input
                  id="ud-last"
                  type="text"
                  name="Last Name"
                  maxLength={80}
                  required
                  placeholder="Doe"
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ud-first">
                  {t('form_first_name')}
                </label>
                <input
                  id="ud-first"
                  type="text"
                  name="First Name"
                  maxLength={40}
                  placeholder="Jane"
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader icon={mkIcon(Eye)} title={t('section_public_profile')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="ud-forum">
                  {t('form_forum')}
                </label>
                <InputWithIcon
                  icon={mkInlineIcon(AtSign)}
                  id="ud-forum"
                  type="text"
                  name="CONTACTCF3"
                  maxLength={255}
                  placeholder="yourforumname"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ud-github">
                  {t('form_github')}
                </label>
                <InputWithIcon
                  icon={<SiGithub size={15} />}
                  id="ud-github"
                  type="url"
                  name="CONTACTCF4"
                  maxLength={255}
                  placeholder="https://github.com/yourname"
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="ud-hw">
                {t('form_maintained_hw')}
              </label>
              <textarea
                id="ud-hw"
                name="CONTACTCF5"
                maxLength={2000}
                rows={3}
                placeholder="odroidn2, rock64, orangepi5"
                className={`${inputBase} resize-none min-h-[96px]`}
              />
              <p className={helpClass}>{t('form_maintained_hw_help')}</p>
            </div>
            <div>
              <label className={labelClass}>{t('form_core_competences')}</label>
              <MultiSelect
                name="CONTACTCF2"
                options={competenceOptions}
                placeholder={t('form_core_competences_placeholder')}
                ariaLabel={t('form_core_competences')}
              />
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-sub))] p-4 cursor-pointer hover:border-[rgb(var(--fg-3))] transition-colors select-none has-[:checked]:border-[rgb(var(--brand)/0.5)] has-[:checked]:bg-[rgb(var(--brand)/0.05)]">
              <input
                type="checkbox"
                name="Email Opt Out"
                className="mt-0.5 h-4 w-4 rounded border-[rgb(var(--border))] accent-[rgb(var(--brand))] shrink-0"
              />
              <span className="text-sm text-[rgb(var(--fg))] leading-relaxed">
                {t('form_hide_public')}
              </span>
            </label>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <SectionHeader icon={mkIcon(Wallet)} title={t('section_payments')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="ud-paypal">
                  {t('form_paypal')}
                </label>
                <InputWithIcon
                  icon={mkInlineIcon(Mail)}
                  id="ud-paypal"
                  type="text"
                  name="CONTACTCF1"
                  maxLength={255}
                  placeholder="paypal@example.com"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ud-company">
                  {t('form_company')}
                </label>
                <InputWithIcon
                  icon={mkInlineIcon(Building2)}
                  id="ud-company"
                  type="text"
                  name="Account Name"
                  maxLength={100}
                  placeholder="Acme Inc."
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader icon={mkIcon(Phone)} title={t('section_contact')} />
            <div>
              <label className={labelClass} htmlFor="ud-mobile">
                {t('form_mobile')}
              </label>
              <InputWithIcon
                icon={mkInlineIcon(Smartphone)}
                id="ud-mobile"
                type="tel"
                name="Mobile"
                maxLength={30}
                pattern="[0-9a-zA-Z+.()\-;\s]+"
                placeholder="+1 555 123 4567"
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader icon={mkIcon(MapPin)} title={t('section_address')} />
            <div>
              <label className={labelClass} htmlFor="ud-street">
                {t('form_street')}
              </label>
              <input
                id="ud-street"
                type="text"
                name="Mailing Street"
                maxLength={250}
                placeholder="Via Roma 12"
                className={inputBase}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor="ud-zip">
                  {t('form_zip')}
                </label>
                <input
                  id="ud-zip"
                  type="text"
                  name="Mailing Zip"
                  maxLength={30}
                  placeholder="00100"
                  className={inputBase}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="ud-city">
                  {t('form_city')}
                </label>
                <input
                  id="ud-city"
                  type="text"
                  name="Mailing City"
                  maxLength={100}
                  placeholder="Roma"
                  className={inputBase}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="ud-state">
                  {t('form_state')}
                </label>
                <input
                  id="ud-state"
                  type="text"
                  name="Mailing State"
                  maxLength={100}
                  placeholder="Lazio"
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ud-country">
                  {t('form_country')}
                </label>
                <input
                  id="ud-country"
                  type="text"
                  name="Mailing Country"
                  maxLength={100}
                  placeholder="Italy"
                  className={inputBase}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between border-t border-[rgb(var(--border))]">
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
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[rgb(var(--brand))] px-7 py-3.5 text-sm font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-all shadow-lg shadow-[rgb(var(--brand)/0.25)] disabled:opacity-50 disabled:shadow-none w-full sm:w-auto"
          >
            {status === 'sending' ? (
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={2} />
            )}
            {t('form_submit')}
          </button>
        </div>
      </form>
    </>
  );
}
