'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ARMBIAN_URLS } from '@armbian/config';
import { SiGithub, SiDiscord, SiMastodon } from '@icons-pack/react-simple-icons';
import { MessageSquare } from 'lucide-react';
import { IconExternalLink } from '@/components/ui/icons';

interface FooterProps {
  /** When set, internal links resolve to this absolute URL instead of the
   *  current host. Used on imager.armbian.com so links point to apex. */
  apexBaseUrl?: string;
}

export function Footer({ apexBaseUrl }: FooterProps = {}) {
  const t = useTranslations('footer');

  const renderInternal = (href: string, className: string, key: string, children: ReactNode) =>
    apexBaseUrl ? (
      <a key={key} href={`${apexBaseUrl}${href}`} className={className}>
        {children}
      </a>
    ) : (
      <Link key={key} href={href} className={className}>
        {children}
      </Link>
    );

  const projectLinks = [
    { key: 'link_boards', href: '/boards' },
    { key: 'link_vendors', href: '/vendors' },
    { key: 'link_partners', href: '/partners' },
    { key: 'link_team', href: '/authors' },
  ] as const;

  const resourceLinks = [
    { key: 'link_docs', href: ARMBIAN_URLS.DOCS },
    { key: 'link_forum', href: ARMBIAN_URLS.FORUM },
    { key: 'link_github', href: ARMBIAN_URLS.GITHUB_ORG },
    { key: 'link_imager', href: ARMBIAN_URLS.IMAGER },
  ] as const;

  const communityLinks = [
    { key: 'link_contribute', href: ARMBIAN_URLS.CONTRIBUTE, external: true },
    { key: 'link_donate', href: '/donate', external: false },
    { key: 'link_contact', href: '/contact' },
    { key: 'link_update_data', href: '/update-data' },
  ] as const;

  const legalLinks = [
    { key: 'link_privacy', href: '/privacy' },
    { key: 'link_terms', href: '/terms' },
    { key: 'link_imprint', href: '/imprint' },
  ] as const;

  return (
    <footer className="border-t border-[rgb(var(--border))]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img
              src="/armbian-logo-white.png"
              alt="Armbian"
              width={400}
              height={60}
              className="h-6 w-auto hidden dark:block"
            />
            <img
              src="/armbian-logo-black.png"
              alt="Armbian"
              width={400}
              height={60}
              className="h-6 w-auto block dark:hidden"
            />
            <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--fg-3))]">
              {t('description')}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[
                { href: ARMBIAN_URLS.GITHUB_ORG, icon: <SiGithub size={14} />, label: 'GitHub' },
                { href: ARMBIAN_URLS.DISCORD, icon: <SiDiscord size={14} />, label: 'Discord' },
                {
                  href: ARMBIAN_URLS.TWITTER,
                  icon: (
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  label: 'X',
                },
                { href: ARMBIAN_URLS.MASTODON, icon: <SiMastodon size={14} />, label: 'Mastodon' },
                {
                  href: ARMBIAN_URLS.LINKEDIN,
                  icon: (
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  ),
                  label: 'LinkedIn',
                },
                {
                  href: ARMBIAN_URLS.FORUM,
                  icon: <MessageSquare size={14} strokeWidth={1.5} />,
                  label: 'Forum',
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-sub))] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Project */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-3))]">
              {t('section_project')}
            </h4>
            <ul className="mt-3 space-y-2">
              {projectLinks.map((link) => (
                <li key={link.key}>
                  {renderInternal(
                    link.href,
                    'text-sm text-[rgb(var(--fg-2))] transition-colors hover:text-[rgb(var(--fg))]',
                    link.key,
                    t(link.key),
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-3))]">
              {t('section_resources')}
            </h4>
            <ul className="mt-3 space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[rgb(var(--fg-2))] transition-colors hover:text-[rgb(var(--fg))] inline-flex items-center gap-1"
                  >
                    {t(link.key)}
                    <IconExternalLink size={11} className="opacity-40" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-3))]">
              {t('section_community')}
            </h4>
            <ul className="mt-3 space-y-2">
              {communityLinks.map((link) =>
                'external' in link && link.external ? (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[rgb(var(--fg-2))] transition-colors hover:text-[rgb(var(--fg))] inline-flex items-center gap-1"
                    >
                      {t(link.key)}
                      <IconExternalLink size={11} className="opacity-40" />
                    </a>
                  </li>
                ) : (
                  <li key={link.key}>
                    {renderInternal(
                      link.href,
                      'text-sm text-[rgb(var(--fg-2))] transition-colors hover:text-[rgb(var(--fg))]',
                      link.key,
                      t(link.key),
                    )}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-[rgb(var(--border))] pt-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.key}>
                {renderInternal(
                  link.href,
                  'text-xs text-[rgb(var(--fg-3))] transition-colors hover:text-[rgb(var(--fg))]',
                  link.key,
                  t(link.key),
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[rgb(var(--fg-3))]">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
