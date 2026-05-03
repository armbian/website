'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ARMBIAN_URLS } from '@armbian/config';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { IconExternalLink } from '@/components/ui/icons';
import { Menu, X } from 'lucide-react';

const internalLinks = [
  { key: 'boards', href: '/boards' },
  { key: 'partners', href: '/partners' },
  { key: 'contact', href: '/contact' },
] as const;

const externalLinks = [
  { key: 'docs', href: ARMBIAN_URLS.DOCS },
  { key: 'community', href: ARMBIAN_URLS.FORUM },
] as const;

interface NavbarProps {
  showLanguageSwitcher?: boolean;
}

export function Navbar({ showLanguageSwitcher = true }: NavbarProps = {}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (hamburgerRef.current?.contains(target)) return;
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || mobileOpen
          ? 'bg-[rgb(var(--bg)/0.85)] backdrop-blur-2xl border-b border-[rgb(var(--border)/0.3)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/armbian-logo-white.png"
            alt="Armbian"
            width={400}
            height={60}
            className="h-6 sm:h-7 w-auto max-w-[140px] object-contain hidden dark:block"
          />
          <img
            src="/armbian-logo-black.png"
            alt="Armbian"
            width={400}
            height={60}
            className="h-6 sm:h-7 w-auto max-w-[140px] object-contain block dark:hidden"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {internalLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))]"
            >
              {t(link.key)}
            </Link>
          ))}
          {externalLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))]"
            >
              {t(link.key)}
              <IconExternalLink size={12} className="opacity-40" />
            </a>
          ))}

          <div className="ml-2 flex items-center gap-1.5 border-l border-[rgb(var(--border))] pl-4">
            <ThemeToggle />
            {showLanguageSwitcher && <LanguageSwitcher />}
          </div>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--border))] transition-colors hover:bg-[rgb(var(--bg-sub))]"
            aria-label={t('menu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          ref={drawerRef}
          className="md:hidden border-t border-[rgb(var(--border)/0.3)] bg-[rgb(var(--bg)/0.95)] backdrop-blur-2xl animate-slide-up"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {internalLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))]"
              >
                {t(link.key)}
              </Link>
            ))}
            {externalLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))]"
              >
                {t(link.key)}
                <IconExternalLink size={12} className="opacity-40" />
              </a>
            ))}
            {showLanguageSwitcher && (
              <div className="pt-3 mt-2 border-t border-[rgb(var(--border)/0.3)]">
                <LanguageSwitcher />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
