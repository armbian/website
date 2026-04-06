'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';
import { useTranslations } from 'next-intl';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('nav');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--border))] transition-colors hover:bg-[rgb(var(--bg-sub))]"
      aria-label={isDark ? t('theme_light') : t('theme_dark')}
    >
      {mounted ? (
        isDark ? (
          <Sun size={16} strokeWidth={1.5} />
        ) : (
          <Moon size={16} strokeWidth={1.5} />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
