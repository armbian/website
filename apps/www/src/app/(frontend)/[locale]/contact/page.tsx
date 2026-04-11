import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ARMBIAN_URLS } from '@armbian/config';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { ContactForm } from '@/components/contact/contact-form';
import {
  Calendar,
  Briefcase,
  Users,
  Hash,
  ArrowRight,
  Mail,
  Building2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { SiDiscord } from '@icons-pack/react-simple-icons';
import { getPayload } from 'payload';
import config from '@payload-config';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('hero_title'),
    description: t('hero_desc'),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  // Fetch company config from CMS with hardcoded fallbacks
  const defaults = {
    companyName: 'Armbian d.o.o.',
    street: 'Reboljeva ulica 5',
    city: '1000 Ljubljana',
    country: 'Slovenia',
    vatId: 'SI38201194',
    iban: 'SI56 0400 0028 2106 011',
    swift: 'KBMASI2X',
    email: ARMBIAN_URLS.INFO_EMAIL,
    officeHoursDay: '',
    calendlyOfficeHours: ARMBIAN_URLS.CALENDLY_OFFICE_HOURS,
    calendlyConsultation: ARMBIAN_URLS.CALENDLY_CONSULTATION,
  };
  let company = { ...defaults };
  try {
    const payload = await getPayload({ config });
    const cfg = await payload.findGlobal({ slug: 'company-config' });
    const raw = cfg as unknown as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      const val = raw[key];
      if (typeof val === 'string' && val) (company as Record<string, string>)[key] = val;
    }
  } catch {
    /* CMS unavailable, use fallbacks */
  }

  return (
    <div className="min-h-screen">
      <PageHero className="!pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-fluid-3xl font-black tracking-tight leading-[0.95] mb-4">
                {t('hero_title')}
              </h1>
              <p className="text-fluid-lg text-[rgb(var(--fg-2))] leading-relaxed max-w-2xl mx-auto">
                {t('hero_desc')}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </PageHero>

      {/* ── Bento Grid: Form + Cards ── */}
      <section className="pt-8 pb-24 sm:pt-12 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
            {/* ── Form ── */}
            <div className="lg:col-span-7 lg:row-span-3 self-stretch">
              <ScrollReveal className="h-full">
                <div className="bento-card rounded-2xl p-8 sm:p-10 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 rounded-full bg-[rgb(var(--brand))]" />
                    <div>
                      <h2 className="text-lg font-bold">{t('form_title')}</h2>
                      <p className="text-xs text-[rgb(var(--fg-3))]">{t('form_subtitle')}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <ContactForm />
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ── Office Hours ── */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.05}>
                <div className="bento-card rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[rgb(var(--brand)/0.06)] rounded-full blur-3xl translate-x-8 -translate-y-8 group-hover:opacity-100 opacity-50 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand)/0.12)] flex items-center justify-center">
                          <Calendar
                            size={18}
                            strokeWidth={1.5}
                            className="text-[rgb(var(--brand))]"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{t('office_hours_title')}</h3>
                          <p className="text-[11px] text-[rgb(var(--fg-3))] font-mono">
                            {t('office_hours_day')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[rgb(var(--fg-3))] mb-5 leading-relaxed">
                      {t('office_hours_desc')}
                    </p>
                    <a
                      href={company.calendlyOfficeHours}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--brand))] px-4 py-2 text-xs font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-all shadow-lg shadow-[rgb(var(--brand)/0.2)]"
                    >
                      <Calendar size={12} strokeWidth={2.5} />
                      {t('office_hours_cta')}
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ── Business Consultation ── */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.1}>
                <div className="bento-card rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 w-28 h-28 bg-amber-500/5 rounded-full blur-3xl -translate-x-6 translate-y-6 group-hover:opacity-100 opacity-50 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center">
                          <Briefcase size={18} strokeWidth={1.5} className="text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{t('consultation_title')}</h3>
                          <p className="text-[11px] text-amber-400 font-mono">
                            {t('consultation_badge')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[rgb(var(--fg-3))] mb-5 leading-relaxed">
                      {t('consultation_desc')}
                    </p>
                    <a
                      href={company.calendlyConsultation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      {t('consultation_cta')}
                      <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ── Quick Support + Community ── */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.15}>
                <div className="bento-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/12 flex items-center justify-center">
                      <Zap size={18} strokeWidth={1.5} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{t('quick_support_title')}</h3>
                      <p className="text-[11px] text-emerald-400 font-mono">48h</p>
                    </div>
                  </div>
                  <p className="text-xs text-[rgb(var(--fg-3))] mb-4 leading-relaxed">
                    {t('quick_support_desc')}
                  </p>
                  <a
                    href={ARMBIAN_URLS.SUBSCRIPTIONS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--brand))] hover:underline"
                  >
                    {t('quick_support_cta')} <ArrowRight size={11} strokeWidth={2.5} />
                  </a>

                  {/* Community mini-grid inside the card */}
                  <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.05)]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--fg-3))] mb-3">
                      {t('community_title')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          title: t('forum_title'),
                          href: ARMBIAN_URLS.FORUM,
                          icon: <Users size={15} strokeWidth={1.5} />,
                          color: 'text-blue-400',
                          bg: 'bg-blue-500/10',
                        },
                        {
                          title: t('discord_title'),
                          href: ARMBIAN_URLS.DISCORD,
                          icon: <SiDiscord size={14} />,
                          color: 'text-indigo-400',
                          bg: 'bg-indigo-500/10',
                        },
                        {
                          title: t('irc_title'),
                          href: ARMBIAN_URLS.IRC,
                          icon: <Hash size={15} strokeWidth={1.5} />,
                          color: 'text-green-400',
                          bg: 'bg-green-500/10',
                        },
                      ].map((ch) => (
                        <a
                          key={ch.title}
                          href={ch.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1.5 rounded-xl py-2.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${ch.bg} flex items-center justify-center ${ch.color} group-hover:scale-110 transition-transform`}
                          >
                            {ch.icon}
                          </div>
                          <span className="text-[10px] font-semibold text-[rgb(var(--fg-3))] group-hover:text-[rgb(var(--fg))] transition-colors">
                            {ch.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Company Info ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bento-card rounded-2xl p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--fg-3))] mb-4">
                {t('company_title')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
                <div className="flex items-start gap-3">
                  <Building2
                    size={16}
                    strokeWidth={1.5}
                    className="text-[rgb(var(--fg-3))] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-xs">{company.companyName}</p>
                    <p className="text-[11px] text-[rgb(var(--fg-3))]">{company.street}</p>
                    <p className="text-[11px] text-[rgb(var(--fg-3))]">
                      {company.city}, {company.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash
                    size={16}
                    strokeWidth={1.5}
                    className="text-[rgb(var(--fg-3))] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs">VAT ID: {company.vatId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2
                    size={16}
                    strokeWidth={1.5}
                    className="text-[rgb(var(--fg-3))] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-mono">IBAN: {company.iban}</p>
                    <p className="text-[11px] text-[rgb(var(--fg-3))] font-mono">
                      SWIFT/BIC: {company.swift}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail
                    size={16}
                    strokeWidth={1.5}
                    className="text-[rgb(var(--fg-3))] mt-0.5 shrink-0"
                  />
                  <a
                    href={`mailto:${company.email}`}
                    className="text-xs text-[rgb(var(--brand))] hover:underline"
                  >
                    {company.email}
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
