import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { ConsentProvider } from '@/components/consent/consent-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { CookieBanner } from '@/components/consent/cookie-banner';
import enMessages from '@/messages/en.json';

// Narrow subset — shipping the full en.json (~50 KB) is wasteful here.
const imagerMessages = {
  nav: enMessages.nav,
  footer: enMessages.footer,
  cookie_banner: enMessages.cookie_banner,
};

export default async function ImagerLayout({ children }: { children: ReactNode }) {
  // Internal nav/footer links must jump to the apex site only when the user
  // is actually on the imager sub-host (e.g. imager.armbian.com). On localhost
  // or any other host the imager is just /imager on the main site — keep
  // links local so dev navigation works.
  const host = (await headers()).get('host') ?? '';
  const apexBaseUrl = host.startsWith('imager.')
    ? `https://${process.env['NEXT_PUBLIC_PRIMARY_DOMAIN'] ?? 'armbian.com'}`
    : undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://cache.armbian.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('armbian-theme');var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased font-sans">
        <NextIntlClientProvider locale="en" messages={imagerMessages}>
          <ThemeProvider>
            <ConsentProvider>
              <Navbar showLanguageSwitcher={false} apexBaseUrl={apexBaseUrl} />
              <main>{children}</main>
              <Footer apexBaseUrl={apexBaseUrl} />
              <ScrollToTop />
              <CookieBanner />
            </ConsentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
