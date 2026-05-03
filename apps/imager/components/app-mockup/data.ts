import { createContext, useContext } from 'react';
import { cleanVendorName, vendorLogoUrl } from '@armbian/config';
import type { BoardSummary } from '@armbian/schemas';
import { API_BASE } from '@/lib/api';
import type { ArmbianData, BoardEntry, DemoTier, MfgInfo, OsEntry, Selection } from './types';

export const DataCtx = createContext<{ data: ArmbianData; sel: Selection }>(null!);
export const useD = () => useContext(DataCtx);

const DEMO_OS_ENTRIES: OsEntry[] = [
  {
    name: 'Armbian 25.5 bookworm',
    de: 'GNOME',
    deKey: 'gnome',
    kernel: 'Current 6.12',
    kernelKey: 'current',
    size: '1.4 GB',
    distro: 'debian',
  },
  {
    name: 'Armbian 25.5 noble',
    de: 'XFCE',
    deKey: 'xfce',
    kernel: 'Edge 6.18',
    kernelKey: 'edge',
    size: '1.1 GB',
    distro: 'ubuntu',
  },
  {
    name: 'Armbian 25.5 bookworm',
    de: 'CLI',
    deKey: 'cli',
    kernel: 'Current 6.12',
    kernelKey: 'current',
    size: '320 MB',
    distro: 'debian',
  },
  {
    name: 'Armbian 25.5 trixie',
    de: 'KDE',
    deKey: 'kde',
    kernel: 'Edge 6.18',
    kernelKey: 'edge',
    size: '1.6 GB',
    distro: 'debian',
  },
];

const DEMO_OS_ENTRIES_NO_DESKTOP: OsEntry[] = [
  DEMO_OS_ENTRIES[2],
  {
    name: 'Armbian 25.5 noble',
    de: 'CLI',
    deKey: 'cli',
    kernel: 'Vendor 5.10',
    kernelKey: 'vendor',
    size: '260 MB',
    distro: 'ubuntu',
  },
];

const DEMO_TIER_ORDER: Record<DemoTier, number> = { platinum: 0, standard: 1, community: 2 };

/**
 * Build the demo dataset consumed by the animated app mockup from the
 * normalized board catalog returned by /api/v1/boards. We only need
 * manufacturer grouping + tier metadata; per-board OS entries are
 * synthesized from a small demo set (the mockup is purely visual and
 * never actually flashes anything).
 */
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

  const imagesByBoard: Record<string, OsEntry[]> = {};
  for (const b of boards) {
    imagesByBoard[b.slug] = b.has_desktop ? DEMO_OS_ENTRIES : DEMO_OS_ENTRIES_NO_DESKTOP;
  }

  return { manufacturers, boardsByMfg, imagesByBoard };
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  if (arr.length <= 1) return arr[0];
  const filtered = exclude !== undefined ? arr.filter((x) => x !== exclude) : arr;
  return (filtered.length > 0 ? filtered : arr)[
    Math.floor(Math.random() * (filtered.length > 0 ? filtered : arr).length)
  ];
}

export function makeSelection(data: ArmbianData, prev?: Selection | null): Selection {
  const eligible = data.manufacturers
    .map((m, i) => ({ m, i }))
    .filter(({ m }) =>
      (data.boardsByMfg[m.id] || []).some(
        (b) => b.tier === 'platinum' && (data.imagesByBoard[b.slug] || []).length > 0,
      ),
    );
  if (eligible.length === 0) return { mfgIdx: 0, boardIdx: 0, osIdx: 0 };

  const mfgEntry = pickRandom(
    eligible,
    prev ? eligible.find((e) => e.i === prev.mfgIdx) : undefined,
  );
  const { i: mfgIdx, m: mfg } = mfgEntry;
  const boards = data.boardsByMfg[mfg.id] || [];
  const platBoards = boards
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.tier === 'platinum' && (data.imagesByBoard[b.slug] || []).length > 0);
  const boardEntry = pickRandom(
    platBoards,
    prev && prev.mfgIdx === mfgIdx ? platBoards.find((e) => e.i === prev.boardIdx) : undefined,
  );
  const { i: boardIdx, b: board } = boardEntry;
  const osImages = data.imagesByBoard[board.slug] || [];
  const osIdx = osImages.length > 0 ? Math.floor(Math.random() * osImages.length) : 0;

  return { mfgIdx, boardIdx, osIdx };
}

export function selMfg(d: ArmbianData, s: Selection): MfgInfo {
  return d.manufacturers[s.mfgIdx];
}
export function selBoards(d: ArmbianData, s: Selection): BoardEntry[] {
  return d.boardsByMfg[selMfg(d, s).id] || [];
}
export function selBoard(d: ArmbianData, s: Selection): BoardEntry {
  return selBoards(d, s)[s.boardIdx];
}
export function selOsImages(d: ArmbianData, s: Selection): OsEntry[] {
  return d.imagesByBoard[selBoard(d, s).slug] || [];
}
export function selOs(d: ArmbianData, s: Selection): OsEntry | undefined {
  return selOsImages(d, s)[s.osIdx];
}
