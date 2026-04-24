import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { UserCog } from 'lucide-react';
import { getApiClient } from '@/lib/api.server';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import { UpdateDataForm } from '@/components/update-data/update-data-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'update_data' });
  return {
    title: t('hero_title'),
    description: t('hero_desc'),
  };
}

export default async function UpdateDataPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('update_data');

  let formTokens: {
    xnQsjsdp: string;
    xmIwtLD: string;
    actionType: string;
    recaptchaSiteKey: string;
  } | null = null;
  try {
    const api = await getApiClient();
    const res = await api.getUpdateDataFormTokens();
    formTokens = res.data;
  } catch {
    /* API unavailable — form will be disabled */
  }

  return (
    <div className="min-h-screen">
      <PageHero className="!pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <h1 className="text-fluid-3xl font-black tracking-tight leading-[0.95] mb-4">
                {t('hero_title')}
              </h1>
              <p className="text-fluid-lg text-[rgb(var(--fg-2))] leading-relaxed">
                {t('hero_desc')}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </PageHero>

      <section className="pb-24 pt-8 sm:pb-32 sm:pt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bento-card rounded-2xl p-6 sm:p-10">
              <div className="flex items-start gap-4 mb-10 pb-6 border-b border-[rgb(var(--border))]">
                <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--brand)/0.12)] flex items-center justify-center shrink-0">
                  <UserCog size={22} strokeWidth={1.75} className="text-[rgb(var(--brand))]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight">{t('intro_title')}</h2>
                  <p className="text-xs text-[rgb(var(--fg-3))] mt-1 leading-relaxed">
                    {t('intro_desc')}
                  </p>
                </div>
              </div>
              <UpdateDataForm tokens={formTokens} />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
