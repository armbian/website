'use client';

import { motion } from 'motion/react';
import { Disc, HardDrive, CircleCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useC } from './theme';
import { useD, selBoard, selOs } from './data';
import { MonoLogoChip, BoardImage } from './image-components';
import { MarqueeText } from './home-split';
import { ACCENT, ACCENT_RGB, FLASH_STAGES, getMonoLogo, formatOsIdentity } from './constants';
import type { Phase } from './types';

/** Hardcoded demo storage device (no host detection on the website). */
const DEVICE_NAME = 'Built In SDXC Reader';
const DEVICE_SIZE = '14.8 GB';

/** Easing token lifted verbatim from the desktop theme.css. */
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface FlashScreenProps {
  /** Flow phase; only `flashing` and `done` are handled here. */
  phase: Phase;
  /** Active index into FLASH_STAGES while flashing. */
  flashStage: number;
  /** Determinate progress 0-100; -1 (or an indeterminate stage) sweeps the sliver. */
  progress: number;
  /** Pulses the primary "Done" button just before the demo advances. */
  clicking: boolean;
}

/** Kept in sync with the desktop FlashProgress.tsx two-column layout. */
export function FlashScreen({ phase, flashStage, progress, clicking }: FlashScreenProps) {
  const c = useC();
  const { data, sel } = useD();
  const board = selBoard(data, sel);
  const os = selOs(data, sel);

  const isComplete = phase === 'done';
  const stage = FLASH_STAGES[Math.min(flashStage, FLASH_STAGES.length - 1)]!;
  const indeterminate = !isComplete && (stage.indeterminate || progress < 0);
  // Glow brightness tracks progress; indeterminate stages sit at mid-glow.
  const glowP = isComplete ? 100 : indeterminate ? 50 : Math.max(progress, 0);

  const hasMono = os ? !!getMonoLogo(os.distribution, os.application) : false;
  const osText = os ? formatOsIdentity(os) : 'Armbian';

  // Completion shows a distinct filled icon so it is not confused with the verifying stage.
  const StageIcon = isComplete ? CircleCheck : stage.icon;
  // Stage tint mirrors desktop .stage-icon: verifying=warning, complete=success, rest=accent.
  const stageColor = isComplete ? c.success : stage.key === 'verifying' ? c.warning : ACCENT;
  const stageLabel = isComplete ? 'Flash complete!' : stage.label;

  return (
    <div
      className="mx-auto flex w-full max-w-[1060px] items-center justify-center"
      style={{
        // Fixed px (not vw/vh): the mockup is a fixed 1024px canvas scaled by --mockup-scale
        // in preview.tsx, so viewport units would drift out of proportion with the rest of the UI.
        gap: '56px',
        padding: '28px 8px',
        animation: `mockup-content-in 0.45s ${EASE_OUT_EXPO} 0.12s both`,
      }}
    >
      {/* Left: floating board hero over a breathing, progress-coupled halo. */}
      <div className="relative flex min-w-0 flex-[0_1_360px] items-center justify-center">
        <motion.div
          aria-hidden="true"
          className="absolute aspect-square rounded-full"
          style={{
            width: '78%',
            background: `radial-gradient(circle, rgba(${ACCENT_RGB},0.28) 0%, rgba(${ACCENT_RGB},0.1) 38%, transparent 70%)`,
            filter: 'blur(14px)',
            // Progress-coupled brightness/scale, layered over the breathing loop.
            opacity: 0.55 + (glowP / 100) * 0.45,
          }}
          animate={{
            scale: [0.96 * (0.98 + (glowP / 100) * 0.08), 1.06 * (0.98 + (glowP / 100) * 0.08)],
          }}
          transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="relative z-[1] flex w-full items-center justify-center"
          animate={{ y: [0, -12] }}
          transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        >
          {/* Natural aspect ratio so each board photo stays undistorted. */}
          <BoardImage
            slug={board.slug}
            name={board.name}
            imgClassName="h-auto w-full max-w-[340px] object-contain [filter:drop-shadow(0_30px_44px_rgba(0,0,0,0.5))]"
          />
        </motion.div>
      </div>

      {/* Right: summary + stage progress, or the done celebration. */}
      <div className="flex min-w-0 max-w-[560px] flex-1 flex-col gap-[28px] text-left">
        <div className="flex flex-col items-start gap-[10px]">
          <h2
            className="m-0 font-bold leading-[1.08]"
            style={{ fontSize: '40px', color: c.text, letterSpacing: '-0.02em' }}
          >
            {board.name}
          </h2>
          <div className="flex h-[36px] w-full min-w-0 flex-nowrap items-center gap-[8px]">
            <div
              className="inline-flex h-[36px] min-w-0 max-w-full flex-[0_1_auto] items-center gap-[8px] px-[14px]"
              style={{
                background: c.bgSec,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                color: c.textSec,
              }}
            >
              {hasMono && os ? (
                <MonoLogoChip distro={os.distribution} app={os.application} size={26} light />
              ) : (
                <Disc size={20} className="shrink-0" style={{ color: c.textSec }} />
              )}
              <MarqueeText text={osText} className="min-w-0 flex-[1_1_0] text-[13px] font-medium" />
            </div>
            <div
              className="inline-flex h-[36px] w-fit min-w-0 flex-[0_1_auto] items-center gap-[8px] px-[14px]"
              style={{
                background: `rgba(${ACCENT_RGB},0.08)`,
                border: `1px solid rgba(${ACCENT_RGB},0.2)`,
                borderRadius: 16,
                color: ACCENT,
              }}
            >
              <HardDrive size={16} className="shrink-0" style={{ color: ACCENT }} />
              <MarqueeText
                text={DEVICE_NAME}
                className="min-w-0 flex-[1_1_0] text-[13px] font-semibold"
              />
              <span
                className="ml-[4px] shrink-0 border-l pl-[8px] text-[12px]"
                style={{ borderColor: `rgba(${ACCENT_RGB},0.2)`, color: c.textSec }}
              >
                {DEVICE_SIZE}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[12px]">
          {/* Keyed remount per stage triggers the cross-fade entrance. */}
          <div
            key={isComplete ? 'complete' : stage.key}
            className="flex items-center gap-[12px]"
            style={{ animation: `mockup-content-in 0.3s ${EASE_OUT_EXPO} both` }}
          >
            {isComplete ? (
              <motion.span
                className="inline-flex"
                style={{ color: stageColor, transformOrigin: 'center' }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.18, 1], opacity: [0, 1, 1] }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.55, 1] }}
              >
                <StageIcon size={48} />
              </motion.span>
            ) : (
              // Active stage icon breathes, mirrors desktop .stage-icon pulse.
              <motion.span
                className="inline-flex"
                style={{ color: stageColor }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
              >
                <StageIcon size={48} />
              </motion.span>
            )}
            <span
              className="font-semibold"
              style={{
                fontSize: '21px',
                // Neutral label, only the icon carries the stage tint (desktop .flash-progress__label).
                color: isComplete ? c.success : c.text,
                letterSpacing: '-0.01em',
              }}
            >
              {stageLabel}
            </span>
          </div>

          {!isComplete ? (
            <div className="flex w-full flex-col gap-[12px]">
              {/* Hairline track: determinate fills; indeterminate sweeps a sliver. */}
              <div
                aria-hidden="true"
                className="relative h-[4px] w-full max-w-[420px] overflow-hidden rounded-full"
                style={{ background: `rgba(${ACCENT_RGB},0.12)` }}
              >
                {indeterminate ? (
                  <div
                    className="absolute inset-y-0 left-0 h-full w-[32%] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${ACCENT} 0%, #ff8c42 100%)`,
                      boxShadow: `0 0 8px rgba(${ACCENT_RGB},0.4)`,
                      animation: 'mockup-track-slide 1.5s cubic-bezier(0.4,0,0.2,1) infinite',
                    }}
                  />
                ) : (
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(progress, 0)}%`,
                      background: `linear-gradient(90deg, ${ACCENT} 0%, #ff8c42 100%)`,
                      boxShadow: `0 0 8px rgba(${ACCENT_RGB},0.4)`,
                      transition: `width 0.4s ${EASE_OUT_EXPO}`,
                    }}
                  />
                )}
              </div>
              <PhaseDots stageKey={stage.key} />
            </div>
          ) : (
            <>
              <p className="m-0 mt-[16px] text-[14px] leading-[1.5]" style={{ color: c.textSec }}>
                Your SD card is ready! You can safely remove it and insert it into your {board.name}
                .
              </p>
              <div className="mt-[20px] flex justify-start gap-[8px]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[8px] rounded-[8px] px-[20px] py-[10px] text-[13px] font-semibold"
                  style={{
                    background: c.bgSec,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  Flash Another
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[8px] rounded-[8px] px-[20px] py-[10px] text-[13px] font-semibold text-white"
                  style={{
                    background: ACCENT,
                    transform: clicking ? 'scale(0.96)' : 'scale(1)',
                    filter: clicking ? 'brightness(0.92)' : 'none',
                    transition: 'transform 0.15s ease, filter 0.15s ease',
                  }}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Maps a FLASH_STAGES key to its macro phase index, mirrors desktop stageToPhase. */
function stageKeyToPhase(key: string): number {
  switch (key) {
    case 'downloading':
    case 'verifying-sha':
      return 0;
    case 'decompressing':
      return 1;
    case 'writing':
      return 2;
    case 'verifying':
      return 3;
    default:
      return 4;
  }
}

/** Four phase dots (Download · Prepare · Write · Verify); current widens into a pill. */
function PhaseDots({ stageKey }: { stageKey: string }) {
  const active = stageKeyToPhase(stageKey);
  return (
    <div
      aria-hidden="true"
      className="flex w-full max-w-[420px] items-center justify-center gap-[8px]"
    >
      {Array.from({ length: 4 }, (_, i) => {
        const done = i < active;
        const current = i === active;
        const style: CSSProperties = {
          height: 6,
          width: current ? 20 : 6,
          borderRadius: 9999,
          background: current
            ? ACCENT
            : done
              ? `rgba(${ACCENT_RGB},0.55)`
              : `rgba(${ACCENT_RGB},0.18)`,
          boxShadow: current ? `0 0 8px rgba(${ACCENT_RGB},0.45)` : 'none',
          transition:
            'width 0.3s cubic-bezier(0.34,1.56,0.64,1), background-color 0.3s ease, box-shadow 0.3s ease',
        };
        return <span key={i} style={style} />;
      })}
    </div>
  );
}
