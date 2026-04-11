'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SupportBadge } from '@/components/ui/support-badge';
import type { BoardSummary } from '@armbian/schemas';

export function BoardCard({ board }: { board: BoardSummary }) {
  const t = useTranslations('boards');
  return (
    <Link
      href={`/boards/${board.slug}`}
      className="hw-card rounded-2xl group flex flex-col overflow-hidden relative"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] bg-[rgb(var(--bg-sub))] p-4">
        {board.image_url ? (
          <img
            src={board.image_url}
            alt={board.name}
            className="hw-img object-contain p-2"
            style={{
              objectFit: 'contain',
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-[rgb(var(--fg-3)/0.3)]">
            {board.name.charAt(0)}
          </div>
        )}
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
