'use client';

import { Check, Settings } from 'lucide-react';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useC } from './theme';
import { STEPS, ACCENT } from './constants';

interface HeaderProps {
  /** Indices of the steps already committed (0-based); drives the completed (accent + check) chips. */
  completed: number[];
  /** Hide the settings gear during the flashing/done screens (desktop behaviour). */
  isFlashing?: boolean;
}

/** Mirrors src/components/layout/Header.tsx; decorative only (the mockup is non-interactive). */
export function Header({ completed, isFlashing = false }: HeaderProps) {
  const c = useC();

  return (
    <div className="flex items-center justify-between px-6 pt-4 pb-3">
      <Image src={c.logo} alt="Armbian" width={340} height={52} className="h-[42px] w-auto" />

      <div className="flex items-center gap-[10px]">
        <HeaderSteps completed={completed} />
        {!isFlashing && (
          <div
            className="flex h-[40px] w-[40px] items-center justify-center rounded-[9px]"
            style={{ background: 'transparent', border: `1px solid ${c.border}` }}
          >
            <Settings className="h-[18px] w-[18px]" style={{ color: c.textSec, opacity: 0.8 }} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Per-chip entrance stagger (mirrors desktop .is-entering .header-step nth-child delays). */
const CHIP_DELAY = ['0.1s', '0.17s', '0.24s', '0.31s'] as const;

/** Only completed chips get emphasis; active state lives in the sidebar, matching desktop. */
function HeaderSteps({ completed }: { completed: number[] }) {
  const c = useC();

  return (
    <div
      className="flex items-center gap-[2px] rounded-full px-2 py-[5px]"
      style={{
        background: c.bgSec,
        border: `1px solid ${c.borderLight}`,
        boxShadow: c.shadow,
      }}
    >
      {STEPS.map((label, i) => {
        const isCompleted = completed.includes(i);

        // Completed steps get accent fill + white check (desktop .header-step.completed); else outline.
        const indicatorStyle: CSSProperties = isCompleted
          ? {
              background: ACCENT,
              border: `1.5px solid ${ACCENT}`,
              color: '#fff',
            }
          : {
              background: 'transparent',
              border: `1.5px solid ${c.border}`,
              color: c.textMuted,
            };

        const labelColor = isCompleted ? c.textSec : c.textMuted;

        return (
          <div
            key={label}
            className="flex items-center gap-2 rounded-[9px] px-[13px] py-[7px]"
            style={{
              animation: 'mockup-ui-up 0.5s cubic-bezier(0.16,1,0.3,1) backwards',
              animationDelay: CHIP_DELAY[i],
            }}
          >
            <span
              className="flex h-[23px] w-[23px] items-center justify-center rounded-full text-[12px] font-semibold"
              style={indicatorStyle}
            >
              {isCompleted ? <Check size={14} /> : i + 1}
            </span>
            <span
              className="text-[12px] font-semibold uppercase"
              style={{ color: labelColor, letterSpacing: '0.5px' }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
