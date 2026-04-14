'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SupportBadge } from '@/components/ui/support-badge';
import { BoardImage } from '@/components/board/board-image';
import type { BoardSummary } from '@armbian/schemas';

export function BoardCard({ board }: { board: BoardSummary }) {
  const t = useTranslations('boards');
  return (
    <Link
      href={`/boards/${board.slug}`}
      className="hw-card rounded-2xl group flex flex-col overflow-hidden relative"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] bg-[rgb(var(--bg-sub))] p-4 flex items-center justify-center">
        <BoardImage src={board.image_url} alt={board.name} />
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold group-hover:text-[rgb(var(--brand))]">
            {board.name}
          </h3>
          <SupportBadge tier={board.support_tier} />
        </div>
        <p className="mt-0.5 truncate text-xs text-[rgb(var(--fg-3))]">{board.vendor_name}</p>
        <p className="mt-auto pt-2 text-xs text-[rgb(var(--fg-3))]">
          {t('images_count', { count: board.image_count })}
        </p>
      </div>
    </Link>
  );
}
