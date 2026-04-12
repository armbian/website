import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { LOCALES, DEFAULT_LOCALE } from '@armbian/config';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { AnnouncementsBanner } from '@/components/announcements-banner';
import type { Metadata } from 'next';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  const title = t('title');
  const description = t('description');

  const alternates: Record<string, string> = {};
  for (const loc of LOCALES) {
    alternates[loc] = loc === DEFAULT_LOCALE ? '/' : `/${loc}`;
  }
  alternates['x-default'] = '/';

  return {
    metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] || 'https://www.armbian.com'),
    title: {
      template: '%s | Armbian',
      default: title,
    },
    description,
    alternates: {
      canonical: locale === DEFAULT_LOCALE ? '/' : `/${locale}`,
      languages: alternates,
    },
    openGraph: {
      type: 'website',
      siteName: 'Armbian',
      title,
      description,
      locale,
      images: [{ url: '/armbian-icon.png', width: 1024, height: 1024, alt: 'Armbian' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/armbian-icon.png'],
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const tAnnouncements = await getTranslations({ locale, namespace: 'announcements' });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <Navbar />
            <AnnouncementsBanner readMoreLabel={tAnnouncements('read_more')} />
            <main>{children}</main>
            <Footer />
            <ScrollToTop />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
