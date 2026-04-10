'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BoardSummary } from '@armbian/schemas';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export function BoardSearch() {
  const t = useTranslations('boards');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BoardSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = (await res.json()) as { data: BoardSummary[] };
          setResults(json.data.slice(0, 8));
          setIsOpen(true);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search_placeholder')}
        className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[rgb(var(--fg-3))] focus:border-[rgb(var(--brand))] focus:ring-1 focus:ring-[rgb(var(--brand))]"
        aria-label={t('search_placeholder')}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--fg-3))] border-t-[rgb(var(--brand))]" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] shadow-lg"
        >
          {results.map((board) => (
            <li key={board.slug}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[rgb(var(--bg-sub))]"
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                  router.push(`/boards/${board.slug}`);
                }}
              >
                <div className="flex-1">
                  <p className="font-medium">{board.name}</p>
                  <p className="text-xs text-[rgb(var(--fg-3))]">
                    {board.vendor_name}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[rgb(var(--fg-3))]">
                  {t('images_short', { count: board.image_count })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
