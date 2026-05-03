import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { ActiveSectionProvider } from '@/providers/active-section-provider';
import { siteMetadata } from '@/content/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  metadataBase: new URL(siteMetadata.url),
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: 'Armbian Imager',
    locale: 'en_US',
    type: 'website',
    images: [{ url: siteMetadata.ogImage, width: 1200, height: 630, alt: siteMetadata.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [siteMetadata.ogImage],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Armbian Imager',
    description: siteMetadata.description,
    url: siteMetadata.url,
    operatingSystem: 'Windows, macOS, Linux',
    applicationCategory: 'DeveloperApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    downloadUrl: 'https://github.com/armbian/imager/releases/latest',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Armbian',
    url: 'https://www.armbian.com',
    logo: `${siteMetadata.url}/icon-512.png`,
    sameAs: [
      'https://github.com/armbian',
      'https://forum.armbian.com',
      'https://discord.com/invite/armbian',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Armbian Imager',
    url: siteMetadata.url,
    description: siteMetadata.description,
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://cache.armbian.com" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <ActiveSectionProvider>{children}</ActiveSectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
