'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Layers,
  Star,
  RefreshCw,
  AppWindow,
  Box,
  Download,
  ArrowRight,
  Monitor,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { useC } from './theme';
import { useD, selOsImages } from './data';
import {
  ACCENT,
  ACCENT_RGB,
  KERNEL_BADGES,
  REST_FILTER_BUTTONS,
  IMAGE_FILTER_PREDICATES,
  getOsInfo,
  getKernelType,
  getImageVariantLabel,
  getMonoLogo,
  categoryOf,
  statusOf,
  versionLabel,
  isTrunkImage,
  hexToRgba,
  formatBytes,
  formatBuildDate,
  distroGradient,
  distroBlock,
  distroVars,
  type OsCategory,
} from './constants';
import type { OsImage } from './types';

/** Non-promoted toolbar filter keys (recommended is pinned, never a toggle). */
type RestFilter = 'stable' | 'rolling' | 'apps' | 'barebone';

/** Staggered card-entrance delay, capped so late cards don't lag noticeably. */
function staggerDelay(index: number): string {
  return `${Math.min(index, 18) * 0.04}s`;
}

function SoftBadge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border px-[9px] py-[4px] text-[10.5px] font-semibold leading-none"
      style={{ color, background: hexToRgba(color, 0.14), borderColor: hexToRgba(color, 0.36) }}
    >
      <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  color,
  count,
  date,
}: {
  icon: LucideIcon;
  title: string;
  color: string;
  count: number;
  date?: string;
}) {
  const c = useC();
  return (
    <div className="flex items-center gap-[11px]">
      <span
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]"
        style={{ color, background: hexToRgba(color, 0.15) }}
      >
        <Icon size={16} />
      </span>
      <h3 className="m-0 text-[18px] font-extrabold tracking-[-0.2px]" style={{ color: c.text }}>
        {title}
      </h3>
      <span
        className="shrink-0 rounded-full px-[9px] py-[2px] text-[12px] font-bold"
        style={{ color: c.textMuted, background: c.bgSec }}
      >
        {count}
      </span>
      <span
        className="ml-[3px] h-[1px] flex-1 rounded-[1px]"
        style={{ background: `linear-gradient(90deg, ${hexToRgba(color, 0.3)}, transparent)` }}
      />
      {date && (
        <span
          className="ml-[3px] inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap text-[11.5px] font-semibold"
          style={{ color: c.textMuted }}
        >
          <Calendar size={12} style={{ opacity: 0.75 }} />
          {date}
        </span>
      )}
    </div>
  );
}

/** Skeleton split card shown while images load (mirrors `.os-card.is-skeleton`). */
function OsCardSkeleton() {
  const c = useC();
  return (
    <div
      className="flex min-h-[92px] flex-row items-stretch overflow-hidden rounded-[16px]"
      style={{ background: c.bgCard, border: `1px solid ${c.borderLight}` }}
    >
      <div
        className="grid shrink-0 basis-[88px] place-items-center"
        style={{ background: c.bgSec }}
      >
        <span
          className="mockup-shimmer h-[54px] w-[54px] rounded-[12px]"
          style={{ background: c.bgHover }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px] px-[15px] py-[13px]">
        <div className="flex flex-col gap-[3px]">
          <span
            className="mockup-shimmer h-[14px] w-[72%] rounded-[6px]"
            style={{ background: c.bgHover }}
          />
          <span
            className="mockup-shimmer h-[11px] w-[44%] rounded-[6px]"
            style={{ background: c.bgHover }}
          />
        </div>
        <div className="mt-auto pt-[10px]">
          <span
            className="mockup-shimmer block h-[22px] w-[90px] rounded-full"
            style={{ background: c.bgHover }}
          />
        </div>
      </div>
    </div>
  );
}

/** Recommended (gradient hero) card - mirrors `.dl-card`. */
function RecommendedCard({
  image,
  index,
  active,
}: {
  image: OsImage;
  index: number;
  active: boolean;
}) {
  const osInfo = getOsInfo(image.distribution);
  const distroName = osInfo?.name || image.distribution || '';
  const status = statusOf(image);
  const kernelType = getKernelType(image.kernelBranch);
  const kernelBadge = kernelType ? KERNEL_BADGES[kernelType] : null;
  const monoLogo = getMonoLogo(image.distribution, image.application);

  return (
    <div
      className="os-enter relative flex min-h-[168px] cursor-pointer flex-col gap-[14px] overflow-hidden rounded-[16px] p-[18px] text-left text-white"
      style={{
        background: distroGradient(distroName),
        animation: 'mockup-card-in 0.5s cubic-bezier(0.16,1,0.3,1) backwards',
        animationDelay: staggerDelay(index),
        transform: active ? 'translateY(-4px)' : undefined,
        boxShadow: active ? '0 22px 44px -14px rgba(0,0,0,0.55)' : undefined,
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease',
      }}
    >
      {monoLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={monoLogo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[-32px] top-1/2 z-0 h-[210%] w-auto -translate-y-1/2 object-contain"
          style={{ opacity: 0.1, filter: 'brightness(0) invert(1)' }}
        />
      )}
      <div className="relative z-[1] flex items-start justify-between gap-[12px]">
        <div
          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[8px]"
          style={{
            background: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.22)',
          }}
        >
          {monoLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={monoLogo}
              alt={distroName}
              className="h-[30px] w-[30px] object-contain"
              style={{ filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
            />
          ) : (
            <Package size={28} color="#fff" />
          )}
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-[6px] whitespace-nowrap rounded-full px-[12px] py-[6px] text-[12px] font-semibold text-white"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <span className="h-[8px] w-[8px] rounded-full" style={{ background: status.color }} />
          {status.label}
        </span>
      </div>
      <div className="relative z-[1] mt-auto flex flex-col gap-[12px]">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[20px] font-extrabold leading-[1.2]">
            Armbian {versionLabel(image)} {getImageVariantLabel(image)}
          </span>
          {distroName && (
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>
              {distroName}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-[12px]">
          {(kernelBadge || image.kernelBranch) && (
            <span
              className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full px-[12px] py-[6px] text-[12px] font-semibold"
              style={{ background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.95)' }}
            >
              <span
                className="h-[8px] w-[8px] rounded-full"
                style={{ background: kernelBadge?.color ?? '#10b981' }}
              />
              {kernelBadge?.label ?? image.kernelBranch}
              {image.kernelVersion ? ` ${image.kernelVersion}` : ''}
            </span>
          )}
          <span className="inline-flex items-center gap-[12px]">
            {image.sizeBytes > 0 && (
              <span className="inline-flex items-center gap-[8px] whitespace-nowrap text-[16px] font-bold text-white">
                <Download size={15} />
                {formatBytes(image.sizeBytes)}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Compact split card for non-recommended images - mirrors `.os-card`. */
function OsCard({ image, index, active }: { image: OsImage; index: number; active: boolean }) {
  const c = useC();
  const osInfo = getOsInfo(image.distribution);
  const distroName = osInfo?.name || image.distribution || '';
  const monoLogo = getMonoLogo(image.distribution, image.application);
  const kernelType = getKernelType(image.kernelBranch);
  const kernelBadge = kernelType ? KERNEL_BADGES[kernelType] : null;
  const vars = distroVars(distroName);
  const ring = (vars as Record<string, string>)['--distro-ring'];
  const glow = (vars as Record<string, string>)['--distro-glow'];
  const distro = (vars as Record<string, string>)['--distro'];

  return (
    <div
      className="os-enter relative flex min-h-[92px] cursor-pointer flex-row items-stretch overflow-hidden rounded-[16px]"
      style={{
        ...vars,
        background: `linear-gradient(180deg, ${c.bgHover} 0%, ${c.bgCard} 58%)`,
        border: `1px solid ${active ? ring : c.border}`,
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -16px rgba(0,0,0,0.55), 0 0 26px -12px ${glow}`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: active ? 'translateY(-6px)' : undefined,
        animation: 'mockup-card-in 0.5s cubic-bezier(0.16,1,0.3,1) backwards',
        animationDelay: staggerDelay(index),
        transition:
          'transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <div
        className="grid shrink-0 basis-[88px] place-items-center"
        style={{ background: distroBlock(distroName) }}
      >
        <div className="grid place-items-center text-white">
          {monoLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={monoLogo}
              alt={distroName}
              className="h-[40px] w-[40px] object-contain"
              style={{ filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
            />
          ) : (
            <Package size={34} color="#fff" />
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-start gap-[3px] px-[15px] py-[13px]">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span
            className="overflow-hidden text-[15px] font-bold leading-[1.3] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]"
            style={{ color: c.text }}
          >
            Armbian {versionLabel(image)} {getImageVariantLabel(image)}
          </span>
          {distroName && (
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]"
              style={{ color: c.textMuted }}
            >
              {distroName}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-[8px] pt-[10px]">
          <div className="flex min-w-0 flex-nowrap gap-[6px]">
            {kernelBadge && (
              <SoftBadge
                color={kernelBadge.color}
                label={`${kernelBadge.label}${image.kernelVersion ? ` ${image.kernelVersion}` : ''}`}
              />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-[10px]">
            {image.sizeBytes > 0 && (
              <span
                className="inline-flex items-center gap-[5px] whitespace-nowrap text-[11.5px] font-semibold"
                style={{ color: c.textMuted }}
              >
                <Download size={12} style={{ opacity: 0.8 }} />
                {formatBytes(image.sizeBytes)}
              </span>
            )}
            <ArrowRight
              size={18}
              className="shrink-0"
              style={{
                color: active ? distro : c.textMuted,
                transform: active ? 'translateX(3px)' : undefined,
                transition: 'transform 0.25s ease, color 0.25s ease',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Decorative rolling/community confirmation overlay, flashed briefly during auto-play. */
function ConfirmDialog({ message }: { message: string }) {
  const c = useC();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: c.overlay }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px] rounded-[16px] p-[22px]"
        style={{ background: c.bgCard, border: `1px solid ${c.border}`, boxShadow: c.shadowHeavy }}
      >
        <h4 className="m-0 mb-[8px] text-[16px] font-bold" style={{ color: c.text }}>
          Image Status
        </h4>
        <p className="m-0 mb-[18px] text-[13px] leading-[1.5]" style={{ color: c.textSec }}>
          {message}
        </p>
        <div className="flex justify-end gap-[10px]">
          <span
            className="rounded-[10px] px-[16px] py-[8px] text-[13px] font-semibold"
            style={{ background: c.bgSec, color: c.textSec }}
          >
            Cancel
          </span>
          <span
            className="rounded-[10px] px-[16px] py-[8px] text-[13px] font-semibold text-white"
            style={{ background: ACCENT }}
          >
            Confirm
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Mirrors desktop OsPanel.tsx so the mockup stays faithful to the real app. */
export function OsGallery({ clicking, loading }: { clicking: boolean; loading: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const [filterType] = useState<'all' | RestFilter>('all');

  const images = useMemo(() => selOsImages(data, sel), [data, sel]);
  const selectedImage = images[sel.osIdx];

  // Promoted images stay on top regardless of the active filter.
  const recommended = useMemo(() => images.filter((img) => img.promoted), [images]);

  const availableFilters = useMemo(() => {
    const result = {} as Record<RestFilter, boolean>;
    REST_FILTER_BUTTONS.forEach(({ key }) => {
      result[key as RestFilter] = images.some(
        (img) => !img.promoted && IMAGE_FILTER_PREDICATES[key]!(img),
      );
    });
    return result;
  }, [images]);

  // Non-promoted images matching the active filter.
  const rest = useMemo(() => {
    const base = images.filter((img) => !img.promoted);
    if (filterType === 'all') return base;
    return base.filter(IMAGE_FILTER_PREDICATES[filterType]!);
  }, [images, filterType]);

  // Decorative warning shown when the selected build is rolling or its board is community-tier.
  const board = data.boardsByMfg[data.manufacturers[sel.mfgIdx]!.id]?.[sel.boardIdx];
  const needsWarning =
    clicking && !!selectedImage && (board?.tier === 'community' || isTrunkImage(selectedImage));
  const warningMessage =
    board?.tier === 'community'
      ? 'This board is community-maintained. Images may be less tested than officially supported boards.'
      : 'This is a rolling-release (trunk) build. It tracks the latest changes and may be unstable.';

  /** Render the non-recommended images: grouped under "All Images", flat under a specific filter. */
  function renderRest() {
    if (filterType !== 'all') {
      return (
        <div
          className="grid items-stretch gap-[14px]"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))' }}
        >
          {rest.map((img, i) => (
            <OsCard
              key={img.fileUrl}
              image={img}
              index={i}
              active={clicking && img === selectedImage}
            />
          ))}
        </div>
      );
    }
    const groups: Array<{ id: OsCategory; title: string; icon: LucideIcon; color: string }> = [
      { id: 'desktop', title: 'Desktop', icon: Monitor, color: '#3b82f6' },
      { id: 'minimal', title: 'Minimal / IoT', icon: Box, color: '#14b8a6' },
      { id: 'apps', title: 'Dedicated Application', icon: AppWindow, color: '#8b5cf6' },
      { id: 'rolling', title: 'Rolling Releases', icon: RefreshCw, color: '#f59e0b' },
    ];
    return groups.map(({ id, title, icon, color }) => {
      const items = rest.filter((img) => categoryOf(img) === id);
      if (items.length === 0) return null;
      return (
        <section key={id} className="flex flex-col gap-[14px]">
          <SectionHeader
            icon={icon}
            title={title}
            color={color}
            count={items.length}
            date={formatBuildDate(items)}
          />
          <div
            className="grid items-stretch gap-[14px]"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))' }}
          >
            {items.map((img, i) => (
              <OsCard
                key={img.fileUrl}
                image={img}
                index={i}
                active={clicking && img === selectedImage}
              />
            ))}
          </div>
        </section>
      );
    });
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Filter toolbar: "All Images" pinned, then available rest filters. */}
      <div className="flex flex-shrink-0 flex-wrap gap-[8px] px-[22px] pb-[8px] pt-[18px]">
        <FilterButton icon={Layers} label="All Images" active={filterType === 'all'} />
        {REST_FILTER_BUTTONS.map(({ key, labelKey, icon: Icon }) =>
          availableFilters[key as RestFilter] ? (
            <FilterButton key={key} icon={Icon} label={labelKey} active={filterType === key} />
          ) : null,
        )}
      </div>

      {loading ? (
        <div className="mockup-scroll flex flex-1 flex-col gap-[22px] p-[22px]">
          <div
            className="grid items-stretch gap-[14px]"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))' }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <OsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : recommended.length === 0 && rest.length === 0 ? (
        <div
          className="grid flex-1 place-items-center p-[40px] text-[14px]"
          style={{ color: c.textMuted }}
        >
          No images available
        </div>
      ) : (
        <div className="mockup-scroll flex flex-1 flex-col gap-[22px] p-[22px]">
          {recommended.length > 0 && (
            <section className="flex flex-col gap-[14px]">
              <SectionHeader
                icon={Star}
                title="Recommended"
                color="#f2651f"
                count={recommended.length}
                date={formatBuildDate(recommended)}
              />
              <div
                className="grid gap-[16px]"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(recommended.length, 3)}, minmax(0, 1fr))`,
                }}
              >
                {recommended.map((img, i) => (
                  <RecommendedCard
                    key={img.fileUrl}
                    image={img}
                    index={i}
                    active={clicking && img === selectedImage}
                  />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && renderRest()}
        </div>
      )}

      <AnimatePresence>
        {needsWarning && <ConfirmDialog key="warn" message={warningMessage} />}
      </AnimatePresence>
    </div>
  );
}

/** A single toolbar filter pill (decorative - auto-play stays on "All Images"). */
function FilterButton({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  const c = useC();
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-[20px] px-[16px] py-[8px] text-[12px] font-semibold"
      style={
        active
          ? {
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: '1px solid transparent',
              color: '#fff',
              boxShadow: `0 4px 12px rgba(${ACCENT_RGB}, 0.4)`,
            }
          : {
              background: `linear-gradient(135deg, ${c.bgCard} 0%, ${c.bgSec} 100%)`,
              border: `1px solid ${c.border}`,
              color: c.textSec,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }
      }
    >
      <Icon size={14} />
      {label}
    </span>
  );
}
