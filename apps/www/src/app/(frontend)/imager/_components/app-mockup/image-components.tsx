'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { BOARD_CDN, FALLBACK_BOARD_IMG, distroBlock, getOsInfo, getMonoLogo } from './constants';
import type { MfgInfo } from './types';

/**
 * Vendor logo on the manufacturer card, mirroring desktop `.mfr-card__logo`.
 * Missing/failed logos fall back to a 76px initials tile (desktop `.mfr-card__initials`).
 */
export function VendorLogo({ mfg }: { mfg: MfgInfo }) {
  const [failed, setFailed] = useState(false);
  if (failed || !mfg.logo) {
    return (
      <div
        className="grid h-[76px] w-[76px] place-items-center rounded-[16px] text-[22px] font-bold"
        style={{ background: '#f0f2f4', color: '#555' }}
      >
        {mfg.name.substring(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={mfg.logo}
      alt={mfg.name}
      className="max-h-[92px] max-w-[200px] object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function BoardImage({
  slug,
  name,
  fill,
  imgClassName,
}: {
  slug: string;
  name: string;
  fill?: boolean;
  /** Overrides the default thumbnail classes (e.g. the flash hero's natural-aspect board). */
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Natural-aspect hero variant: no fixed box, no scale - mirrors desktop `.flash-board-image`.
  if (imgClassName) {
    return failed ? (
      <Image
        src={FALLBACK_BOARD_IMG}
        alt={name}
        width={400}
        height={400}
        className={imgClassName}
      />
    ) : (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={`${BOARD_CDN}/${slug}.png`}
        alt={name}
        className={imgClassName}
        onError={() => setFailed(true)}
      />
    );
  }
  if (fill) {
    return failed ? (
      <Image
        src={FALLBACK_BOARD_IMG}
        alt={name}
        fill
        className="object-contain p-[8px]"
        sizes="100px"
      />
    ) : (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={`${BOARD_CDN}/${slug}.png`}
        alt={name}
        className="absolute inset-0 h-full w-full scale-[1.3] object-contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return failed ? (
    <Image
      src={FALLBACK_BOARD_IMG}
      alt={name}
      width={100}
      height={100}
      className="object-contain p-[8px]"
    />
  ) : (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`${BOARD_CDN}/${slug}.png`}
      alt={name}
      className="h-full w-full scale-[1.3] object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/** Mono mark URL for a distro/app pair; null when none exists so callers pick a fallback icon. */
export function monoLogoFor(distro: string, app?: string | null): string | null {
  return getMonoLogo(distro, app);
}

/**
 * Mark is forced white via filter, not CSS mask-image, which is broken in WebKit.
 * `light` drops the chip border for use on already-tinted surfaces.
 */
export function MonoLogoChip({
  distro,
  app = null,
  size = 26,
  fallback,
  light = false,
}: {
  distro: string;
  app?: string | null;
  size?: number;
  fallback?: ReactNode;
  light?: boolean;
}) {
  const logo = monoLogoFor(distro, app);
  // Resolve a friendly distro name so the gradient picks the right brand tint.
  const distroName = getOsInfo(distro)?.name ?? distro;
  const markSize = Math.round(size * 0.62);

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: distroBlock(distroName),
        border: light ? 'none' : '1px solid rgba(255,255,255,0.22)',
      }}
    >
      {logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logo}
          alt={distroName}
          className="object-contain"
          style={{
            width: markSize,
            height: markSize,
            filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
          }}
        />
      ) : (
        <span className="flex items-center justify-center text-white" style={{ lineHeight: 0 }}>
          {fallback}
        </span>
      )}
    </div>
  );
}
