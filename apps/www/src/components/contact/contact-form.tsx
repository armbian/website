'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { ARMBIAN_URLS } from '@armbian/config';

export function ContactForm() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleSubmit() {
    setStatus('sending');
    setTimeout(() => setStatus('success'), 3000);
  }

  function handleIframeLoad() {
    if (status === 'sending') setStatus('success');
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
      <iframe
        ref={iframeRef}
        name="biginHiddenFrame"
        className="hidden"
        onLoad={handleIframeLoad}
      />
      <form
        method="POST"
        action={ARMBIAN_URLS.BIGIN_FORM}
        target="biginHiddenFrame"
        acceptCharset="UTF-8"
        onSubmit={handleSubmit}
        className="space-y-5 flex-1 flex flex-col"
      >
        <input
          type="hidden"
          name="xnQsjsdp"
          value="8a3429ee12927ae9c27c07c12f33105a5c55ecef1dd8739be38e6f5a578e27ea"
        />
        <input type="hidden" name="zc_gad" value="" />
        <input
          type="hidden"
          name="xmIwtLD"
          value="24f594c268bd49456368bb68dec3340d6434d709a223dcf881a88fe0ddeafee28c5bef380d48302ac03d97b49a711f8e"
        />
        <input type="hidden" name="actionType" value="Q29udGFjdHM=" />
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

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[rgb(var(--brand))] px-7 py-3 text-sm font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-all shadow-lg shadow-[rgb(var(--brand)/0.25)] disabled:opacity-50 disabled:shadow-none"
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
