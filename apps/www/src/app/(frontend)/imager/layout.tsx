import type { ReactNode } from 'react';
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

export default function ImagerLayout({ children }: { children: ReactNode }) {
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
              <Navbar showLanguageSwitcher={false} />
              <main>{children}</main>
              <Footer />
              <ScrollToTop />
              <CookieBanner />
            </ConsentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
