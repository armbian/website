import { createContext, useContext } from 'react';
import { cleanVendorName, vendorLogoUrl } from '@armbian/config';
import type { BoardSummary } from '@armbian/schemas';
import { API_BASE, apiClient } from '../../_lib/api';
import { toOsImage } from './types';
import type { ArmbianData, BoardEntry, DemoTier, MfgInfo, OsImage, Selection } from './types';

export const DataCtx = createContext<{ data: ArmbianData; sel: Selection }>(null!);
export const useD = () => useContext(DataCtx);

const DEMO_TIER_ORDER: Record<DemoTier, number> = { platinum: 0, standard: 1, community: 2 };

/** Avoids refetching a board's images across auto-play cycles. */
const imageCache = new Map<string, OsImage[]>();

/** Only sd-format images are flashable, matching the desktop imager allowlist. */
export async function fetchBoardImages(slug: string): Promise<OsImage[]> {
  const cached = imageCache.get(slug);
  if (cached) return cached;

  const res = await apiClient.getBoardImages(slug);
  const images = res.data.map(toOsImage).filter((i) => i.format === 'sd');
  imageCache.set(slug, images);
  return images;
}

// Vendor groups + tiers come from the live API; per-board images are fetched lazily.
export function processApiData(boards: BoardSummary[]): ArmbianData {
  const vendorMap = new Map<string, { name: string; logo: string | null; boards: BoardEntry[] }>();

  for (const b of boards) {
    if (
      b.support_tier !== 'platinum' &&
      b.support_tier !== 'standard' &&
      b.support_tier !== 'community'
    ) {
      continue;
    }

    const vendorId = b.vendor_slug || 'other';

    let v = vendorMap.get(vendorId);
    if (!v) {
      v = {
        name: cleanVendorName(vendorId, b.vendor_name),
        logo: vendorId !== 'other' ? `${API_BASE}${vendorLogoUrl(vendorId)}` : null,
        boards: [],
      };
      vendorMap.set(vendorId, v);
    }
    v.boards.push({
      slug: b.slug,
      name: b.name,
      imageCount: b.image_count,
      tier: b.support_tier,
    });
  }

  for (const [, v] of vendorMap) {
    v.boards.sort(
      (a, b) => DEMO_TIER_ORDER[a.tier] - DEMO_TIER_ORDER[b.tier] || a.name.localeCompare(b.name),
    );
  }

  const mfgEntries = [...vendorMap.entries()]
    .filter(([id]) => id !== 'other')
    .map(([id, v]) => ({
      id,
      name: v.name,
      logo: v.logo,
      boardCount: v.boards.length,
      platCount: v.boards.filter((b) => b.tier === 'platinum').length,
      stdCount: v.boards.filter((b) => b.tier === 'standard').length,
    }))
    .sort((a, b) => {
      const ap = a.platCount;
      const bp = b.platCount;
      const as_ = a.stdCount;
      const bs = b.stdCount;
      if (ap > 1 !== bp > 1) return ap > 1 ? -1 : 1;
      if (ap > 1 && bp > 1) return bp - ap || b.boardCount - a.boardCount;
      if ((ap === 1) !== (bp === 1)) return ap === 1 ? -1 : 1;
      if (ap === 1 && bp === 1) return bs - as_ || b.boardCount - a.boardCount;
      if (as_ > 1 !== bs > 1) return as_ > 1 ? -1 : 1;
      if (as_ > 1 && bs > 1) return bs - as_ || b.boardCount - a.boardCount;
      return b.boardCount - a.boardCount;
    });

  const manufacturers: MfgInfo[] = mfgEntries.map(({ id, name, logo, boardCount }) => ({
    id,
    name,
    logo,
    boardCount,
  }));
  if (vendorMap.has('other')) {
    const o = vendorMap.get('other')!;
    manufacturers.push({ id: 'other', name: 'Other', logo: null, boardCount: o.boards.length });
  }

  const boardsByMfg: Record<string, BoardEntry[]> = {};
  for (const [id, v] of vendorMap) boardsByMfg[id] = v.boards;

  // Images are fetched lazily per board via fetchBoardImages; start empty.
  return { manufacturers, boardsByMfg, imagesByBoard: {} };
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  if (arr.length <= 1) return arr[0]!;
  const filtered = exclude !== undefined ? arr.filter((x) => x !== exclude) : arr;
  const target = filtered.length > 0 ? filtered : arr;
  return target[Math.floor(Math.random() * target.length)]!;
}

/** Selects platinum boards without images so auto-play need not await async fetches. */
export function makeSelection(data: ArmbianData, prev?: Selection | null): Selection {
  const eligible = data.manufacturers
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => (data.boardsByMfg[m.id] || []).some((b) => b.tier === 'platinum'));
  if (eligible.length === 0) return { mfgIdx: 0, boardIdx: 0, osIdx: 0 };

  const mfgEntry = pickRandom(
    eligible,
    prev ? eligible.find((e) => e.i === prev.mfgIdx) : undefined,
  );
  const { i: mfgIdx, m: mfg } = mfgEntry;
  const boards = data.boardsByMfg[mfg.id] || [];
  const platBoards = boards.map((b, i) => ({ b, i })).filter(({ b }) => b.tier === 'platinum');
  const boardEntry = pickRandom(
    platBoards,
    prev && prev.mfgIdx === mfgIdx ? platBoards.find((e) => e.i === prev.boardIdx) : undefined,
  );
  const { i: boardIdx } = boardEntry;

  return { mfgIdx, boardIdx, osIdx: 0 };
}

export function selMfg(d: ArmbianData, s: Selection): MfgInfo {
  return d.manufacturers[s.mfgIdx]!;
}
export function selBoards(d: ArmbianData, s: Selection): BoardEntry[] {
  return d.boardsByMfg[selMfg(d, s).id] || [];
}
export function selBoard(d: ArmbianData, s: Selection): BoardEntry {
  return selBoards(d, s)[s.boardIdx]!;
}
export function selOsImages(d: ArmbianData, s: Selection): OsImage[] {
  return d.imagesByBoard[selBoard(d, s).slug] || [];
}
export function selOs(d: ArmbianData, s: Selection): OsImage | undefined {
  return selOsImages(d, s)[s.osIdx];
}
