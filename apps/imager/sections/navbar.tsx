'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ScrollLink } from '@/components/scroll-link';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { navigation } from '@/content/navigation';
import Image from 'next/image';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useFocusTrap({ enabled: mobileOpen, onEscape: () => setMobileOpen(false) });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-colors ${
        scrolled ? 'bg-background border-border border-b' : 'bg-transparent'
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center">
          <Image src="/assets/armbian-logo.png" alt="Armbian" width={180} height={28} priority />
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <ScrollLink key={item.href} href={item.href}>
              {item.label}
            </ScrollLink>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          ref={menuRef}
          id="mobile-nav-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className="bg-background/95 border-border border-b backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col gap-4 px-4 py-4">
            {navigation.map((item) => (
              <ScrollLink key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </ScrollLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
