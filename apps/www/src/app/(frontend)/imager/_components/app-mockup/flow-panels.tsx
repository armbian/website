'use client';

import { useEffect, useRef } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useC } from './theme';
import { useD, selMfg, selBoards } from './data';
import { ACCENT, ACCENT_RGB, SUPPORT_TIER_LABEL } from './constants';
import { VendorLogo, BoardImage } from './image-components';
import type { BoardEntry, DemoTier, MfgInfo } from './types';

/** Per-card staggered entrance delay, capped so late cards don't lag. */
function staggerDelay(index: number): string {
  return `${Math.min(index, 18) * 0.04}s`;
}

/** Scroll within `.mockup-scroll` only, so the randomly picked card's selection pulse stays on-screen. */
function scrollCardIntoView(card: HTMLElement | null) {
  const container = card?.closest('.mockup-scroll') as HTMLElement | null;
  if (!card || !container) return;
  const cr = container.getBoundingClientRect();
  const er = card.getBoundingClientRect();
  const margin = 20;
  if (er.top < cr.top + margin) {
    container.scrollBy({ top: er.top - cr.top - margin, behavior: 'smooth' });
  } else if (er.bottom > cr.bottom - margin) {
    container.scrollBy({ top: er.bottom - cr.bottom + margin, behavior: 'smooth' });
  }
}

/** Drop a leading vendor name from a board name so the kicker and title don't duplicate it. */
function stripVendorPrefix(name: string, vendor: string): string {
  if (!vendor) return name;
  const lowerName = name.toLowerCase();
  const lowerVendor = vendor.toLowerCase();
  if (lowerName.startsWith(`${lowerVendor} `)) return name.slice(vendor.length + 1).trim();
  return name;
}

/** Mirrors desktop .bp-tier.is-* overlay badge colours. */
const BP_TIER_STYLE: Record<DemoTier | 'wip' | 'eos' | 'tvb', { bg: string; color: string }> = {
  standard: { bg: '#10b981', color: '#fff' },
  community: { bg: '#3b82f6', color: '#fff' },
  wip: { bg: '#f59e0b', color: '#fff' },
  eos: { bg: '#6b7280', color: '#fff' },
  tvb: { bg: '#8b5cf6', color: '#fff' },
  platinum: {
    bg: `linear-gradient(135deg,#ffdf00 0%,#d4af37 50%,${ACCENT} 100%)`,
    color: '#000',
  },
};

/** Shared shell: full-height column with a floating search pill head + scrollable grid. */
function SearchHead({ placeholder }: { placeholder: string }) {
  const c = useC();
  return (
    <div className="shrink-0 px-[22px] pt-[18px] pb-[8px]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2"
          size={16}
          style={{ color: c.textMuted }}
        />
        <div
          className="flex items-center rounded-[16px] py-[14px] pr-4 pl-[46px] text-[14px]"
          style={{
            background: c.bgApp,
            border: `1px solid ${c.border}`,
            boxShadow: '0 8px 22px -10px rgba(0,0,0,0.25)',
            color: c.textMuted,
          }}
        >
          {placeholder}
        </div>
      </div>
    </div>
  );
}

/** Resolve a manufacturer's tier badge: platinum if its boards include any platinum tier. */
function mfgTier(boards: BoardEntry[]): 'platinum' | null {
  return boards.some((b) => b.tier === 'platinum') ? 'platinum' : null;
}

/** Mirrors desktop ManufacturerPanel.tsx; the selected card pulses an accent ring while clicking. */
export function MfrPanel({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const selMfgId = selMfg(data, sel).id;

  // Scroll the (randomly chosen) selected card into view the instant it's selected,
  // so the scroll and the selection pulse happen together and read as one action.
  const selCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (clicking) scrollCardIntoView(selCardRef.current);
  }, [clicking]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <SearchHead placeholder="Search manufacturers..." />
      <div
        className="mockup-scroll grid min-h-0 flex-1 content-start gap-[18px] p-[24px]"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        {data.manufacturers.map((mfr: MfgInfo, index) => {
          const boards = data.boardsByMfg[mfr.id] || [];
          const tier = mfgTier(boards);
          const isSel = mfr.id === selMfgId && clicking;
          return (
            <div
              key={mfr.id}
              ref={mfr.id === selMfgId ? selCardRef : undefined}
              className="mockup-card-in relative flex min-h-[206px] w-full flex-col overflow-hidden rounded-[12px]"
              style={{
                animationDelay: staggerDelay(index),
                background: c.bgCard,
                border: isSel ? `1px solid rgba(${ACCENT_RGB},0.4)` : `1px solid ${c.border}`,
                boxShadow: isSel ? c.cardHoverShadow : c.shadow,
                transform: isSel ? 'translateY(-8px) scale(1.01)' : 'none',
                transition:
                  'transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s ease, box-shadow 0.4s ease',
              }}
            >
              {/* Accent glow that fades in on selection - mirrors desktop .mfr-card:hover::before. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  background: `radial-gradient(circle at 50% 0%, rgba(${ACCENT_RGB},0.07), transparent 70%)`,
                  opacity: isSel ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
              />
              <div
                className="relative grid h-[124px] shrink-0 place-items-center p-4"
                style={{ background: '#ffffff', borderBottom: `1px solid ${c.borderLight}` }}
              >
                {/* Logo scales up on selection - mirrors desktop .mfr-card:hover .mfr-card__logo. */}
                <div
                  className="transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: isSel ? 'scale(1.1)' : 'none' }}
                >
                  <VendorLogo mfg={mfr} />
                </div>
                {tier && (
                  <span
                    className="absolute top-2 right-2 rounded-full px-[9px] py-[3px] text-[9px] font-bold tracking-[0.5px] uppercase"
                    style={{
                      background: BP_TIER_STYLE.platinum.bg,
                      color: BP_TIER_STYLE.platinum.color,
                      boxShadow: '0 0 12px rgba(212,175,55,0.4)',
                    }}
                  >
                    {SUPPORT_TIER_LABEL[tier]}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-[7px] px-4 pt-[14px] pb-4">
                <span
                  className="overflow-hidden text-[15px] leading-[1.2] font-bold text-ellipsis whitespace-nowrap"
                  style={{ color: c.text }}
                >
                  {mfr.name}
                </span>
                <span className="text-[12px]" style={{ color: c.textMuted }}>
                  {mfr.boardCount} {mfr.boardCount === 1 ? 'board' : 'boards'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <GridPager pageCount={1} page={1} />
    </div>
  );
}

/** Mirrors desktop BoardPanel.tsx; the selected card pulses an accent ring while clicking. */
export function BoardPanel({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const mfg = selMfg(data, sel);
  const boards = selBoards(data, sel);

  // Scroll the (randomly chosen) selected board into view the instant it's selected,
  // so the scroll and the selection pulse happen together and read as one action.
  const selCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (clicking) scrollCardIntoView(selCardRef.current);
  }, [clicking]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <SearchHead placeholder="Search boards..." />
      <div
        className="mockup-scroll grid min-h-0 flex-1 content-start gap-[18px] p-[24px]"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        {boards.map((board, index) => {
          const tierStyle = BP_TIER_STYLE[board.tier];
          const tierLabel = SUPPORT_TIER_LABEL[board.tier];
          const displayName = stripVendorPrefix(board.name, mfg.name);
          const isSel = index === sel.boardIdx && clicking;
          return (
            <div
              key={board.slug}
              ref={index === sel.boardIdx ? selCardRef : undefined}
              className="mockup-card-in relative flex min-h-[250px] w-full flex-col overflow-hidden rounded-[16px]"
              style={{
                animationDelay: staggerDelay(index),
                background: c.bgCard,
                border: isSel ? `1px solid rgba(${ACCENT_RGB},0.4)` : `1px solid ${c.border}`,
                boxShadow: isSel
                  ? `0 30px 60px -15px rgba(0,0,0,0.6), 0 0 30px -10px rgba(${ACCENT_RGB},0.2)`
                  : c.shadow,
                transform: isSel ? 'translateY(-8px) scale(1.01)' : 'none',
                transition:
                  'transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s ease, box-shadow 0.4s ease',
              }}
            >
              {/* Accent glow that fades in on selection - mirrors desktop .board-card:hover::before. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  background: `radial-gradient(circle at 50% 0%, rgba(${ACCENT_RGB},0.07), transparent 70%)`,
                  opacity: isSel ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
              />
              <div
                className="relative flex h-[158px] shrink-0 items-center justify-center overflow-hidden p-4"
                style={{ background: c.bgSec }}
              >
                {/* Mirrors the desktop .board-card hover lift so the demo matches real UI. */}
                <BoardImage
                  slug={board.slug}
                  name={board.name}
                  imgClassName={`max-h-full max-w-full object-contain transition-[transform,filter] duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                    isSel
                      ? 'scale-[1.08] rotate-2 [filter:drop-shadow(0_15px_20px_rgba(0,0,0,0.5))]'
                      : ''
                  }`}
                />
                {tierLabel && (
                  <span
                    className="absolute top-[10px] right-[10px] rounded-full px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.5px] uppercase"
                    style={{
                      background: tierStyle.bg,
                      color: tierStyle.color,
                      ...(board.tier === 'platinum'
                        ? { boxShadow: '0 0 12px rgba(212,175,55,0.4)' }
                        : {}),
                    }}
                  >
                    {tierLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-[14px]">
                {mfg.name && (
                  <span
                    className="text-[10px] font-bold tracking-[0.6px] uppercase"
                    style={{ color: ACCENT }}
                  >
                    {mfg.name}
                  </span>
                )}
                <div className="flex items-center justify-between gap-[10px]">
                  <span
                    className="min-w-0 overflow-hidden text-[15px] leading-[1.25] font-bold text-ellipsis whitespace-nowrap"
                    style={{ color: c.text }}
                  >
                    {displayName}
                  </span>
                  <ArrowRight
                    className="shrink-0"
                    size={18}
                    style={{ color: isSel ? ACCENT : c.textMuted }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <GridPager pageCount={1} page={1} />
    </div>
  );
}

/** Renders nothing for a single page; the demo data fits one page, so this is effectively hidden. */
export function GridPager({ pageCount, page }: { pageCount: number; page: number }) {
  const c = useC();
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav
      className="absolute bottom-4 left-1/2 z-[5] flex -translate-x-1/2 flex-wrap items-center justify-center gap-[2px] rounded-full p-[5px]"
      style={{
        background: c.islandBg,
        border: `1px solid ${c.border}`,
        boxShadow: '0 10px 28px -10px rgba(0,0,0,0.28), 0 2px 6px -2px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      }}
    >
      {pages.map((p) => {
        const active = p === page;
        return (
          <span
            key={p}
            className="inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-full px-[10px] text-[13px] font-semibold"
            style={{
              background: active ? ACCENT : 'transparent',
              color: active ? '#fff' : c.textSec,
            }}
          >
            {p}
          </span>
        );
      })}
    </nav>
  );
}
