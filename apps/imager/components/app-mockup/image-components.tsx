'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useC } from './theme';
import { BOARD_CDN, FALLBACK_BOARD_IMG, DEFAULT_COLOR } from './constants';
import type { MfgInfo } from './types';

export function VendorLogo({ mfg }: { mfg: MfgInfo }) {
  const c = useC();
  const [failed, setFailed] = useState(false);
  if (failed || !mfg.logo) {
    return (
      <div
        className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[12px] text-[18px] font-bold text-white"
        style={{ background: DEFAULT_COLOR }}
      >
        {mfg.name.substring(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[12px]"
      style={{
        background: '#fff',
        padding: 4,
        border: `1px solid ${c.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mfg.logo}
        alt={mfg.name}
        className="h-full w-full object-contain p-[4px]"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function BoardImage({ slug, name, fill }: { slug: string; name: string; fill?: boolean }) {
  const [failed, setFailed] = useState(false);
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
