'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BoardImage } from '@/components/board/board-image';
import type { BoardSummary } from '@armbian/schemas';

interface SiblingBoardsCarouselProps {
  boards: BoardSummary[];
  vendorName: string;
  vendorSlug: string;
  vendorBoardCount: number;
}

export function SiblingBoardsCarousel({
  boards,
  vendorName,
  vendorSlug,
  vendorBoardCount,
}: SiblingBoardsCarouselProps) {
  const t = useTranslations('board');
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 'auto',
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on('select', update);
    emblaApi.on('reInit', update);
    return () => {
      emblaApi.off('select', update);
      emblaApi.off('reInit', update);
    };
  }, [emblaApi]);

  const showSeeAll = vendorBoardCount > boards.length + 1;
  const showArrows = canPrev || canNext;

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-2 mb-6">
        <h2 className="text-lg font-bold">
          {t.rich('more_from', {
            vendor: vendorName,
            v: (chunks) => <span className="text-[rgb(var(--brand))]">{chunks}</span>,
          })}
        </h2>
        <div className="flex items-center gap-3 ml-auto">
          {showArrows && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canPrev}
                aria-label={t('carousel_prev')}
                className="w-8 h-8 rounded-full border border-[rgb(var(--border))] flex items-center justify-center transition-colors hover:border-[rgb(var(--brand)/0.5)] hover:text-[rgb(var(--brand))] disabled:opacity-30 disabled:hover:border-[rgb(var(--border))] disabled:hover:text-current disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canNext}
                aria-label={t('carousel_next')}
                className="w-8 h-8 rounded-full border border-[rgb(var(--border))] flex items-center justify-center transition-colors hover:border-[rgb(var(--brand)/0.5)] hover:text-[rgb(var(--brand))] disabled:opacity-30 disabled:hover:border-[rgb(var(--border))] disabled:hover:text-current disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          )}
          {showSeeAll && (
            <Link
              href={`/vendors/${vendorSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--brand))] hover:underline"
            >
              {t('see_all_vendor', { count: vendorBoardCount })}
              <ArrowRight size={13} strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
      <div className="overflow-hidden -my-4 py-4 -mx-4 px-4" ref={emblaRef}>
        <div className="flex gap-3">
          {boards.map((sib) => (
            <Link
              key={sib.slug}
              href={`/boards/${sib.slug}`}
              className="hw-card rounded-2xl p-4 group relative flex flex-col w-[220px] shrink-0"
            >
              <div className="h-28 w-full flex items-center justify-center relative mb-3 z-10 p-3">
                <div className="absolute inset-0 bg-white/[0.03] rounded-xl group-hover:bg-[rgb(var(--brand)/0.05)] transition-colors border border-white/5 group-hover:border-[rgb(var(--brand)/0.2)]" />
                <div className="relative z-10 h-full flex items-center justify-center">
                  <BoardImage src={sib.image_url} alt={sib.name} />
                </div>
              </div>
              <div className="mt-auto border-t border-white/10 pt-3 z-10 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] text-[rgb(var(--brand))] font-mono font-bold uppercase tracking-widest mb-0.5 block truncate">
                    {sib.vendor_name}
                  </span>
                  <h3 className="text-sm font-bold group-hover:text-[rgb(var(--brand))] transition-colors tracking-tight truncate">
                    {sib.name}
                  </h3>
                </div>
                <div className="w-6 h-6 rounded-full bg-[rgb(var(--brand)/0.1)] border border-[rgb(var(--brand)/0.2)] flex items-center justify-center shrink-0 group-hover:bg-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand))] transition-all">
                  <ArrowRight
                    size={12}
                    strokeWidth={2.5}
                    className="text-[rgb(var(--brand))] group-hover:text-black transition-colors"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
