import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Link } from '@/i18n/navigation';
import { ARMBIAN_URLS } from '@armbian/config';
import {
  Heart,
  ArrowRight,
  ShoppingBag,
  Handshake,
  Cpu,
  Server,
  Users,
  Wrench,
} from 'lucide-react';
import { SiGithub, SiPaypal, SiLiberapay } from '@icons-pack/react-simple-icons';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'donate_page' });
  return {
    title: t('hero_title'),
    description: t('hero_subtitle'),
  };
}

function DonateCard({
  icon,
  iconBg,
  title,
  desc,
  cta,
  href,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="hw-card rounded-xl p-5 h-full flex flex-col relative overflow-hidden">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-bold mb-1">{title}</h3>
      <p className="text-xs text-[rgb(var(--fg-2))] leading-relaxed mb-4 flex-1">{desc}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgb(var(--brand)/0.3)] bg-[rgb(var(--brand)/0.05)] px-4 py-2.5 text-xs font-bold text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand))] hover:text-white transition-all mt-auto"
      >
        {cta}
        <ArrowRight size={12} strokeWidth={2.5} />
      </a>
    </div>
  );
}

export default async function DonatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('donate_page');

  return (
    <main className="min-h-screen">
      <PageHero className="!pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--brand)/0.1)] flex items-center justify-center mx-auto mb-6 animate-heartbeat">
              <Heart size={28} strokeWidth={1.5} stroke="rgb(var(--brand))" />
            </div>
            <h1 className="text-fluid-3xl font-black tracking-tight mb-4">{t('hero_title')}</h1>
            <p className="text-fluid-base text-[rgb(var(--fg-2))] leading-relaxed max-w-2xl mx-auto">
              {t('hero_subtitle')}
            </p>
          </ScrollReveal>
        </div>
      </PageHero>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
        <section className="mb-16">
          <ScrollReveal>
            <h2 className="text-xl font-black tracking-tight mb-6">{t('why_title')}</h2>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                {
                  key: '1',
                  icon: <Cpu size={18} strokeWidth={1.5} className="text-[rgb(var(--brand))]" />,
                },
                {
                  key: '2',
                  icon: <Server size={18} strokeWidth={1.5} className="text-[rgb(var(--brand))]" />,
                },
                {
                  key: '3',
                  icon: <Users size={18} strokeWidth={1.5} className="text-[rgb(var(--brand))]" />,
                },
                {
                  key: '4',
                  icon: <Wrench size={18} strokeWidth={1.5} className="text-[rgb(var(--brand))]" />,
                },
              ] as const
            ).map((item, i) => (
              <ScrollReveal key={item.key} delay={i * 0.06} distance={25}>
                <div className="hw-card rounded-xl p-5 h-full relative overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-[rgb(var(--brand)/0.08)] flex items-center justify-center mb-3">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold mb-1">{t(`why_${item.key}_title`)}</h3>
                  <p className="text-xs text-[rgb(var(--fg-2))] leading-relaxed">
                    {t(`why_${item.key}_desc`)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <ScrollReveal>
            <h2 className="text-xl font-black tracking-tight mb-6">{t('methods_title')}</h2>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScrollReveal delay={0} distance={20}>
              <DonateCard
                icon={<SiGithub size={22} className="text-white" />}
                iconBg="#24292f"
                title={t('method_github_title')}
                desc={t('method_github_desc')}
                cta={t('method_github_cta')}
                href={ARMBIAN_URLS.GITHUB_SPONSORS}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.05} distance={20}>
              <DonateCard
                icon={<SiPaypal size={22} className="text-white" />}
                iconBg="#003087"
                title={t('method_paypal_title')}
                desc={t('method_paypal_desc')}
                cta={t('method_paypal_cta')}
                href={ARMBIAN_URLS.PAYPAL}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.1} distance={20}>
              <DonateCard
                icon={<SiLiberapay size={22} className="text-white" />}
                iconBg="#F6C915"
                title={t('method_liberapay_title')}
                desc={t('method_liberapay_desc')}
                cta={t('method_liberapay_cta')}
                href={ARMBIAN_URLS.LIBERAPAY}
              />
            </ScrollReveal>
          </div>
        </section>

        <section className="mb-16">
          <div className="grid gap-4 sm:grid-cols-2">
            <ScrollReveal delay={0} distance={20}>
              <div className="hw-card rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                  <ShoppingBag size={18} strokeWidth={1.5} className="text-purple-400" />
                </div>
                <h3 className="text-base font-bold mb-1">{t('method_merch_title')}</h3>
                <p className="text-xs text-[rgb(var(--fg-2))] leading-relaxed mb-4 flex-1">
                  {t('method_merch_desc')}
                </p>
                <a
                  href={ARMBIAN_URLS.MERCH_EU}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--brand))] hover:underline"
                >
                  {t('method_merch_cta')}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </a>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.05} distance={20}>
              <div className="hw-card rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <Handshake size={18} strokeWidth={1.5} className="text-blue-400" />
                </div>
                <h3 className="text-base font-bold mb-1">{t('method_partnership_title')}</h3>
                <p className="text-xs text-[rgb(var(--fg-2))] leading-relaxed mb-4 flex-1">
                  {t('method_partnership_desc')}
                </p>
                <Link
                  href="/partners"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--brand))] hover:underline"
                >
                  {t('method_partnership_cta')}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section>
          <ScrollReveal>
            <h2 className="text-xl font-black tracking-tight mb-6">{t('other_title')}</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.05} distance={20}>
            <div className="rounded-xl border border-[rgb(var(--border)/0.5)] bg-[rgb(var(--bg-el)/0.3)] divide-y divide-[rgb(var(--border)/0.3)]">
              {(['code', 'docs', 'test', 'community'] as const).map((key) => (
                <div key={key} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--brand))] mt-2 shrink-0" />
                  <p className="text-sm text-[rgb(var(--fg-2))] leading-relaxed">
                    {t(`other_${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>
      </div>
    </main>
  );
}
