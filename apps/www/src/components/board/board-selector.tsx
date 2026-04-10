'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Vendor, BoardSummary } from '@armbian/schemas';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export function BoardSelector() {
  const t = useTranslations('boards');
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(false);

  // Load vendors on mount
  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await fetch(`/api/vendors`);
        if (res.ok) {
          const json = (await res.json()) as { data: Vendor[] };
          const sorted = json.data.sort((a, b) => b.board_count - a.board_count);
          setVendors(sorted);
        }
      } catch {
        // Fail silently
      } finally {
        setLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  // Load boards when vendor changes
  const loadBoards = useCallback(
    async (vendorSlug: string) => {
      if (!vendorSlug) {
        setBoards([]);
        return;
      }
      setLoadingBoards(true);
      setSelectedBoard('');
      try {
        const res = await fetch(
          `/api/boards?vendor=${encodeURIComponent(vendorSlug)}&limit=100`,
        );
        if (res.ok) {
          const json = (await res.json()) as { data: BoardSummary[] };
          setBoards(json.data);
        }
      } catch {
        // Fail silently
      } finally {
        setLoadingBoards(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedVendor) {
      loadBoards(selectedVendor);
    }
  }, [selectedVendor, loadBoards]);

  function handleGo() {
    if (selectedBoard) {
      router.push(`/boards/${selectedBoard}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {/* Manufacturer select */}
      <div className="flex-1">
        <label
          htmlFor="vendor-select"
          className="mb-1.5 block text-sm font-medium text-[rgb(var(--fg-2))]"
        >
          {t('filter_vendor')}
        </label>
        <select
          id="vendor-select"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          disabled={loadingVendors}
          className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] px-3 py-2.5 text-sm outline-none focus:border-[rgb(var(--brand))] disabled:opacity-50"
        >
          <option value="">
            {loadingVendors ? t('selector_loading') : `-- ${t('filter_vendor')} --`}
          </option>
          {vendors.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.name} ({v.board_count})
            </option>
          ))}
        </select>
      </div>

      {/* Board select */}
      <div className="flex-1">
        <label
          htmlFor="board-select"
          className="mb-1.5 block text-sm font-medium text-[rgb(var(--fg-2))]"
        >
          {t('selector_board_label')}
        </label>
        <select
          id="board-select"
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
          disabled={!selectedVendor || loadingBoards}
          className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-el))] px-3 py-2.5 text-sm outline-none focus:border-[rgb(var(--brand))] disabled:opacity-50"
        >
          <option value="">
            {loadingBoards
              ? t('selector_loading')
              : !selectedVendor
                ? `-- ${t('selector_select_vendor_first')} --`
                : `-- ${t('selector_select_board')} --`}
          </option>
          {boards.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Go button */}
      <button
        type="button"
        onClick={handleGo}
        disabled={!selectedBoard}
        className="rounded-lg bg-[rgb(var(--brand))] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-hover))] disabled:opacity-50"
      >
        {t('selector_open_board')} →
      </button>
    </div>
  );
}
