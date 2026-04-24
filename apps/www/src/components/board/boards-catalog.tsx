'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { SupportBadge } from '@/components/ui/support-badge';
import { BoardImage } from '@/components/board/board-image';
import { Pill } from '@/components/ui/pill';
import { SUPPORT_TIERS } from '@armbian/config';
import type { BoardSummary, Vendor, SupportTier } from '@armbian/schemas';
import {
  Search,
  X,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { BoardGridSkeleton } from '@/components/ui/skeleton';

interface BoardsCatalogProps {
  initialBoards: BoardSummary[];
  platinumBoards: BoardSummary[];
  vendors: Vendor[];
  total: number;
  tierCounts: Record<string, number>;
}

const PAGE_SIZE = 24;
const SORT_OPTIONS = ['popularity', 'name', 'support', 'random'] as const;
type SortKey = (typeof SORT_OPTIONS)[number];
const TIER_ORDER = Object.keys(SUPPORT_TIERS).sort(
  (a, b) => SUPPORT_TIERS[a as SupportTier].sortOrder - SUPPORT_TIERS[b as SupportTier].sortOrder,
) as SupportTier[];

/** Page number buttons: prev ... 3 4 [5] 6 7 ... next */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnBase =
    'inline-flex items-center justify-center min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors';

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className={`${btnBase} px-2 ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[rgb(var(--bg-sub))]'}`}
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1 text-[rgb(var(--fg-3))]">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === page
                ? 'bg-[rgb(var(--brand))] text-white'
                : 'hover:bg-[rgb(var(--bg-sub))] text-[rgb(var(--fg-2))]'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`${btnBase} px-2 ${page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[rgb(var(--bg-sub))]'}`}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </nav>
  );
}

export function BoardsCatalog({
  initialBoards,
  platinumBoards,
  vendors: initialVendors,
  total: serverTotal,
  tierCounts: serverTierCounts,
}: BoardsCatalogProps) {
  const t = useTranslations('boards');
  const tSupport = useTranslations('support');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [currentTotal, setCurrentTotal] = useState(serverTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [vendor, setVendor] = useState(searchParams.get('vendor') ?? '');
  const [support, setSupport] = useState(searchParams.get('support') ?? '');
  const [sort, setSort] = useState<SortKey>((searchParams.get('sort') as SortKey) ?? 'popularity');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<BoardSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showAllVendors, setShowAllVendors] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);

  const sortedVendors = useMemo(
    () => initialVendors.filter((v) => v.name?.trim()).sort((a, b) => a.name.localeCompare(b.name)),
    [initialVendors],
  );
  const visibleVendors = showAllVendors ? sortedVendors : sortedVendors.slice(0, 20);
  const totalPages = Math.ceil(currentTotal / PAGE_SIZE);

  // Fetch page from API
  const fetchPage = useCallback(async (p: number, v: string, s: string, srt: SortKey) => {
    setLoading(true);
    setLoadError(false);
    const params = new URLSearchParams();
    if (v) params.set('vendor', v);
    if (s) params.set('support', s);
    params.set('sort', srt);
    params.set('page', String(p));
    params.set('limit', String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/boards?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data: BoardSummary[]; meta: { total: number } };
      setBoards(json.data);
      setCurrentTotal(json.meta.total);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // When filters change → reset to page 1 and fetch
  useEffect(() => {
    if (!vendor && !support && sort === 'popularity' && !searchResults) {
      // No filters — use SSR data
      setBoards(initialBoards);
      setCurrentTotal(serverTotal);
      setPage(1);
      return;
    }
    if (searchResults) return;
    setPage(1);
    void fetchPage(1, vendor, support, sort);
  }, [vendor, support, sort, searchResults, fetchPage, initialBoards, serverTotal]);

  // Page change
  function goToPage(p: number) {
    setPage(p);
    if (p === 1 && !vendor && !support && sort === 'popularity') {
      setBoards(initialBoards);
      setCurrentTotal(serverTotal);
    } else {
      void fetchPage(p, vendor, support, sort);
    }
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // URL sync — use window.location.pathname (which preserves the locale
  // prefix like /it/boards) instead of next-intl's usePathname() which
  // strips it, causing the locale to be lost on replaceState.
  useEffect(() => {
    const params = new URLSearchParams();
    if (vendor) params.set('vendor', vendor);
    if (support) params.set('support', support);
    if (sort !== 'popularity') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    const browserPath = window.location.pathname;
    window.history.replaceState(null, '', qs ? `${browserPath}?${qs}` : browserPath);
  }, [vendor, support, sort, page, pathname]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults(null);
      setSearching(false);
      setLoadError(false);
      return;
    }
    setSearching(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data: BoardSummary[] };
      setSearchResults(json.data);
    } catch {
      setLoadError(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doSearch]);

  const featuredPlatinum = useMemo(() => platinumBoards.slice(0, 4), [platinumBoards]);

  const displayBoards = searchResults ?? boards;
  const displayTotal = searchResults ? searchResults.length : currentTotal;
  const hasFilters = vendor || support || search;

  function clearFilters() {
    setVendor('');
    setSupport('');
    setSort('popularity');
    setSearch('');
    setSearchResults(null);
    setPage(1);
  }

  return (
    <div className="pt-8">
      {/* ── Platinum Featured ── */}
      {featuredPlatinum.length > 0 && (
        <section className="relative mb-10 py-10">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FFDF00] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                  <Star size={16} strokeWidth={2.5} stroke="#000" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">{t('platinum_title')}</h2>
                  <p className="text-xs text-[rgb(var(--fg-3))]">{t('platinum_subtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSupport('platinum');
                  setSearchResults(null);
                  setTimeout(
                    () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                    150,
                  );
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#FFDF00] transition-colors"
              >
                {t('see_all')} ({platinumBoards.length})
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {featuredPlatinum.map((board) => (
                <Link
                  key={board.slug}
                  href={`/boards/${board.slug}`}
                  className="hw-card rounded-2xl p-4 group relative overflow-hidden flex flex-col"
                  style={{ borderColor: 'rgba(212,175,55,0.2)' }}
                >
                  <div className="h-28 w-full flex items-center justify-center relative mb-3 z-10 p-2">
                    <div className="absolute inset-0 bg-white/[0.03] rounded-xl group-hover:bg-[rgb(var(--brand)/0.05)] transition-colors border border-white/5 group-hover:border-[rgb(var(--brand)/0.2)]" />
                    <div className="relative z-10 h-full flex items-center justify-center">
                      <BoardImage src={board.image_url} alt={board.name} />
                    </div>
                  </div>
                  <div className="mt-auto border-t border-white/10 pt-3 z-10 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] text-[#D4AF37] font-mono font-bold uppercase tracking-widest mb-0.5 block truncate">
                        {board.vendor_name}
                      </span>
                      <h3 className="text-sm font-bold group-hover:text-[#D4AF37] transition-colors tracking-tight truncate">
                        {board.name}
                      </h3>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all">
                      <ArrowRight
                        size={12}
                        strokeWidth={2.5}
                        className="text-[#D4AF37] group-hover:text-black transition-colors"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="divider-glow w-full mt-8 pointer-events-none" />
        </section>
      )}

      {/* ── Search ── */}
      <div className="relative mb-5">
        <Search
          size={16}
          strokeWidth={2}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--fg-3))]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-[rgb(var(--fg-3))] focus:border-[rgb(var(--brand))] focus:ring-2 focus:ring-[rgb(var(--brand)/0.15)]"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--fg-3))] border-t-[rgb(var(--brand))]" />
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="space-y-2.5 mb-6">
        <div className="flex flex-wrap items-center gap-1">
          <Pill
            active={!support}
            onClick={() => {
              setSupport('');
              setSearchResults(null);
            }}
          >
            {t('all')} ({serverTotal})
          </Pill>
          {TIER_ORDER.map((tier) =>
            serverTierCounts[tier] ? (
              <Pill
                key={tier}
                active={support === tier}
                color={SUPPORT_TIERS[tier].badgeColor}
                onClick={() => {
                  setSupport(support === tier ? '' : tier);
                  setSearchResults(null);
                }}
              >
                {tSupport(tier)} ({serverTierCounts[tier]})
              </Pill>
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Pill
            active={!vendor}
            onClick={() => {
              setVendor('');
              setSearchResults(null);
            }}
          >
            {t('all')} ({sortedVendors.length})
          </Pill>
          {visibleVendors.map((v) => (
            <Pill
              key={v.slug}
              active={vendor === v.slug}
              onClick={() => {
                setVendor(vendor === v.slug ? '' : v.slug);
                setSearchResults(null);
              }}
            >
              {v.name}
            </Pill>
          ))}
          {sortedVendors.length > 20 && (
            <button
              type="button"
              onClick={() => setShowAllVendors(!showAllVendors)}
              className="text-[11px] font-semibold text-[rgb(var(--brand))] hover:underline px-1.5 py-1"
            >
              {showAllVendors
                ? t('show_less')
                : t('show_more', { count: sortedVendors.length - 20 })}
            </button>
          )}
        </div>
      </div>

      {/* ── Results bar ── */}
      <div ref={gridRef} className="flex items-center justify-between mb-4 scroll-mt-4">
        <span className="text-xs text-[rgb(var(--fg-3))] tabular-nums">
          {searchResults
            ? t('results_count', { count: displayTotal })
            : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, displayTotal)} / ${displayTotal}`}
        </span>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--brand))] hover:underline"
            >
              <X size={12} strokeWidth={2.5} />
              {t('clear_all')}
            </button>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] px-3 py-1.5 text-xs outline-none focus:border-[rgb(var(--brand))] cursor-pointer"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`sort_${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Board Grid ── */}
      {loading ? (
        <BoardGridSkeleton count={PAGE_SIZE} />
      ) : loadError ? (
        <div className="mt-20 text-center">
          <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-red-500/10 mb-4">
            <AlertCircle size={28} strokeWidth={1.5} className="text-red-500" />
          </div>
          <p className="text-lg font-bold">{t('load_error_title')}</p>
          <p className="mt-1 text-sm text-[rgb(var(--fg-3))]">{t('load_error_subtitle')}</p>
          <button
            type="button"
            onClick={() => {
              if (search.length >= 2) void doSearch(search);
              else void fetchPage(page, vendor, support, sort);
            }}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgb(var(--brand))] text-white font-semibold text-sm hover:bg-[rgb(var(--brand-hover))] transition-colors"
          >
            <RefreshCw size={14} strokeWidth={2.5} />
            {t('retry')}
          </button>
        </div>
      ) : displayBoards.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayBoards.map((board) => (
              <Link
                key={board.slug}
                href={`/boards/${board.slug}`}
                className="hw-card rounded-2xl p-4 group relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-3 right-3 z-20">
                  <SupportBadge tier={board.support_tier} />
                </div>
                <div className="h-28 sm:h-32 w-full flex items-center justify-center relative mb-3 z-10 p-2">
                  <div className="absolute inset-0 bg-white/[0.03] rounded-xl group-hover:bg-[rgb(var(--brand)/0.05)] transition-colors border border-white/5 group-hover:border-[rgb(var(--brand)/0.2)]" />
                  <div className="relative z-10 h-full flex items-center justify-center">
                    <BoardImage src={board.image_url} alt={board.name} />
                  </div>
                </div>
                <div className="mt-auto border-t border-white/10 pt-3 z-10 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] text-[rgb(var(--brand))] font-mono font-bold uppercase tracking-widest mb-0.5 block truncate">
                      {board.vendor_name}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold group-hover:text-[rgb(var(--brand))] transition-colors tracking-tight truncate">
                      {board.name}
                    </h3>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand))] transition-all">
                    <ArrowRight
                      size={12}
                      strokeWidth={2.5}
                      className="text-[rgb(var(--fg-3))] group-hover:text-white transition-colors"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Pagination ── */}
          {!searchResults && (
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          )}
        </>
      ) : (
        <div className="mt-20 text-center">
          <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-[rgb(var(--bg-sub))] mb-4">
            <Search size={28} strokeWidth={1.5} className="text-[rgb(var(--fg-3))]" />
          </div>
          <p className="text-lg font-bold">{t('no_results')}</p>
          <p className="mt-1 text-sm text-[rgb(var(--fg-3))]">{t('no_results_subtitle')}</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgb(var(--brand))] text-white font-semibold text-sm hover:bg-[rgb(var(--brand-hover))] transition-colors"
          >
            {t('clear_filters')}
          </button>
        </div>
      )}
    </div>
  );
}
