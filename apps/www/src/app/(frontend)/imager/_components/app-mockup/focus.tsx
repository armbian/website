'use client';

import { type ComponentType, type ReactNode } from 'react';
import { Factory, Cpu, Database, HardDrive, Check, ArrowRight } from 'lucide-react';
import { useC } from './theme';
import { useD, selMfg, selBoard, selOs } from './data';
import { ACCENT, STEPS, getOsInfo, getImageVariantLabel } from './constants';
import { BoardImage } from './image-components';
import type { OsImage } from './types';

const STEP_ICONS: ComponentType<{ size?: number }>[] = [Factory, Cpu, Database, HardDrive];

const STEP_LABELS = ['Manufacturer', 'Board', 'Operating System', 'Storage'] as const;

/** Mirrors HomePage.tsx's chooseBrand/chooseBoard/etc. CTA copy. */
const STEP_CTA = ['Choose brand', 'Choose board', 'Choose OS', 'Choose storage'] as const;

/** Branded OS identity, mirroring desktop formatImageIdentity. */
function osIdentity(os: OsImage): string {
  const name = getOsInfo(os.distribution)?.name ?? os.distribution;
  const variant = getImageVariantLabel(os);
  return `${name} ${variant}`.replace(/\s+/g, ' ').trim();
}

/** Truncation suffices here since the focus card only shows short board/OS names. */
function ValueText({ text }: { text: string }) {
  return (
    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" style={{ minWidth: 0 }}>
      {text}
    </span>
  );
}

/** Resolve the display value for a committed/active step from the current selection. */
function stepValue(
  index: number,
  d: ReturnType<typeof useD>['data'],
  s: ReturnType<typeof useD>['sel'],
): string | undefined {
  switch (index) {
    case 0:
      return selMfg(d, s)?.name;
    case 1:
      return selBoard(d, s)?.name;
    case 2: {
      const os = selOs(d, s);
      return os ? osIdentity(os) : undefined;
    }
    case 3:
      // The website flow has no real device; the storage step shows its CTA only.
      return undefined;
    default:
      return undefined;
  }
}

interface FocusCardProps {
  /** Step whose focus prompt is shown (0=manufacturer, 3=storage). */
  activeStep: number;
  /** Number of committed selections (drives the summary checklist). */
  step: number;
  /** Indices of completed steps, in order. */
  completed: number[];
}

/**
 * Resting-state focus panel shown by HomeSplit when the active step has no inline panel.
 * Mirrors the `.focus` block of src/components/layout/HomePage.tsx.
 */
export function FocusCard({ activeStep, step, completed }: FocusCardProps) {
  const c = useC();
  const { data, sel } = useD();

  const idx = Math.min(Math.max(activeStep, 0), STEPS.length - 1);
  const ActiveIcon = STEP_ICONS[idx]!;
  const kicker = STEP_LABELS[idx]!;
  const cta = STEP_CTA[idx]!;
  const value = stepValue(idx, data, sel);

  // The storage step is the final write action, so its CTA is accent-filled.
  const isPrimary = idx === 3;

  // A board photo replaces the icon once a board is committed.
  const board = step > 1 ? selBoard(data, sel) : undefined;

  const summary: { key: number; label: string; value: ReactNode }[] = completed
    .filter((i) => i < STEPS.length)
    .map((i) => ({
      key: i,
      label: STEP_LABELS[i]! as string,
      value: stepValue(i, data, sel),
    }))
    .filter((row): row is { key: number; label: string; value: string } => !!row.value);

  return (
    <div
      className="flex w-full flex-col items-center text-center"
      style={{
        maxWidth: 360,
        animation: 'mockup-content-in 0.45s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* Visual: board photo when chosen, else the active step's glyph in a round tile. */}
      <div className="mb-[22px] grid h-[168px] w-full place-items-center">
        {board ? (
          <div
            className="relative flex h-[168px] w-full items-center justify-center"
            style={{ filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.2))' }}
          >
            <div className="relative h-[168px] w-[260px]">
              <BoardImage slug={board.slug} name={board.name} fill />
            </div>
          </div>
        ) : (
          <span
            className="grid h-[116px] w-[116px] place-items-center rounded-full"
            style={{
              background: c.bgCard,
              border: `1px solid ${c.borderLight}`,
              color: ACCENT,
              boxShadow: c.shadow,
            }}
          >
            <ActiveIcon size={44} />
          </span>
        )}
      </div>

      <span
        className="text-[11px] font-bold uppercase"
        style={{ letterSpacing: '1.2px', color: ACCENT }}
      >
        {kicker}
      </span>

      <h2
        className="mt-[8px] max-w-full overflow-hidden text-ellipsis text-[26px] font-bold leading-[1.2]"
        style={{ color: c.text }}
      >
        {value ?? cta}
      </h2>

      <button
        type="button"
        className="mt-[20px] inline-flex items-center gap-[8px] rounded-[11px] px-[24px] py-[12px] text-[14px] font-semibold text-white"
        style={{
          border: 'none',
          background: ACCENT,
          boxShadow: isPrimary ? `0 8px 24px rgba(242,101,34,0.35)` : 'none',
        }}
      >
        {cta}
        <ArrowRight size={17} />
      </button>

      {summary.length > 0 && (
        <ul
          className="mt-[22px] flex w-full list-none flex-col gap-[9px] pt-[16px]"
          style={{ borderTop: `1px solid ${c.borderLight}` }}
        >
          {summary.map((row) => (
            <li key={row.key} className="flex min-w-0 items-center gap-[8px] text-[13px]">
              <Check size={13} strokeWidth={3} style={{ color: ACCENT, flexShrink: 0 }} />
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ letterSpacing: '0.5px', color: c.textMuted }}
              >
                {row.label}
              </span>
              <span
                className="ml-auto min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
                style={{ color: c.text }}
              >
                <ValueText text={String(row.value)} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
