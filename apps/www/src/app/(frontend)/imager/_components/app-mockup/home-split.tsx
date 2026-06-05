'use client';

import { useRef, useEffect, useState, type ReactNode, type ComponentType } from 'react';
import {
  Factory,
  Cpu,
  Database,
  HardDrive,
  FolderOpen,
  Check,
  Lock,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { useC } from './theme';
import { useD, selMfg, selBoard, selOs } from './data';
import { ACCENT, ACCENT_RGB, formatOsIdentity } from './constants';
import { FocusCard } from './focus';
import { MfrPanel, BoardPanel } from './flow-panels';
import { OsGallery } from './os-gallery';
import { DevicePanel } from './device-panel';

/** Marquee separator gap (px) between the duplicated text copies. */
const MARQUEE_SEPARATOR = 50;

/** Scrolls text when it overflows; omit maxWidth to measure the live container (keeps flex reflow accurate). */
export function MarqueeText({
  text,
  maxWidth,
  className = '',
}: {
  text: string;
  /** Fixed cap in px; omit to measure the real width and scroll when text exceeds it. */
  maxWidth?: number;
  className?: string;
}) {
  const responsive = maxWidth === undefined;
  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  // Exact px shift for one loop = single-text width + the visible separator, so copy 2 lands
  // precisely where copy 1 started (seamless). A percentage shift mis-aligns and looks garbled.
  const [shiftPx, setShiftPx] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      const el = containerRef.current;
      const measureEl = measureRef.current;
      if (!el || !measureEl) return;
      // In-container hidden span inherits the rendered font, so the width is exact.
      const textWidth = measureEl.offsetWidth;
      const available = responsive ? el.clientWidth : (maxWidth ?? 0);
      // 2px tolerance avoids sub-pixel false positives that show a garbled duplicate when text fits.
      const overflow = available > 0 && textWidth > available + 2;
      setIsOverflow(overflow);
      if (overflow) setShiftPx(textWidth + MARQUEE_SEPARATOR);
    };

    // Measure now, after layout settles, and once web fonts swap in (offsetWidth changes then).
    const timer = setTimeout(checkOverflow, 50);
    const timer2 = setTimeout(checkOverflow, 400);
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(checkOverflow).catch(() => {});
    }
    window.addEventListener('resize', checkOverflow);
    // The pill/column width can change without a window resize (flex reflow); observe the box.
    let observer: ResizeObserver | undefined;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(containerRef.current);
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', checkOverflow);
      observer?.disconnect();
    };
  }, [text, maxWidth, responsive]);

  return (
    <span
      ref={containerRef}
      className={`mockup-marquee-container ${isOverflow ? 'overflow' : ''} ${className}`}
      style={{ maxWidth: responsive ? '100%' : maxWidth }}
      title={text}
    >
      <span
        className="mockup-marquee-content"
        style={
          isOverflow ? ({ '--marquee-shift': `-${shiftPx}px` } as React.CSSProperties) : undefined
        }
      >
        {text}
        {isOverflow && (
          <>
            {/* Fixed-width gap between the two copies; matches the loop shift for seamless scroll. */}
            <span
              aria-hidden="true"
              style={{ display: 'inline-block', width: MARQUEE_SEPARATOR }}
            />
            {text}
          </>
        )}
      </span>
      {/* Hidden single-text copy: measured for true width, never shown, never affects layout. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {text}
      </span>
    </span>
  );
}

/** Visual/interaction state of a sidebar step. */
type StepState = 'done' | 'active' | 'locked';

interface SideStepData {
  key: string;
  index: number;
  icon: ComponentType<{ size?: number }>;
  label: string;
  /** Call-to-action placeholder shown before a value is chosen. */
  cta: string;
  /** Selected value node (a MarqueeText), absent until the step is filled. */
  value?: ReactNode;
  state: StepState;
}

/** Mirrors desktop HomePage.SideStep, themed via inline styles instead of CSS vars. */
function SideStep({ data, delay }: { data: SideStepData; delay: number }) {
  const c = useC();
  const { index, icon: Icon, label, value, state, cta } = data;
  const isActive = state === 'active';
  const isDone = state === 'done';
  const isLocked = state === 'locked';

  const badgeStyle: React.CSSProperties = isDone
    ? { background: ACCENT, borderColor: ACCENT, color: '#fff' }
    : isActive
      ? { borderColor: ACCENT, color: ACCENT }
      : { borderColor: c.border, color: c.textMuted };

  return (
    <div
      className="relative grid w-full items-center gap-3 rounded-[10px] border p-3 text-left mockup-ui-up"
      style={{
        gridTemplateColumns: 'auto auto 1fr auto',
        background: isActive ? c.bgCard : 'transparent',
        borderColor: isActive ? c.borderLight : 'transparent',
        boxShadow: isActive ? c.shadow : 'none',
        opacity: isLocked ? 0.55 : 1,
        animationDelay: `${delay}s`,
      }}
      aria-current={isActive ? 'step' : undefined}
    >
      {isActive && (
        <span
          className="absolute left-0 top-[9px] bottom-[9px] w-[3px] rounded-r-[3px]"
          style={{ background: ACCENT }}
        />
      )}
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[12px] font-semibold"
        style={badgeStyle}
      >
        {isDone ? <Check size={13} strokeWidth={3} /> : index}
      </span>
      <span className="flex items-center" style={{ color: isActive ? ACCENT : c.textSec }}>
        <Icon size={18} />
      </span>
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span
          className="text-[10px] font-bold uppercase leading-none tracking-[0.7px]"
          style={{ color: isActive ? ACCENT : c.textMuted }}
        >
          {label}
        </span>
        {value ? (
          <span
            className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold leading-tight"
            style={{ color: c.text }}
          >
            {value}
          </span>
        ) : (
          <span
            className="text-[13.5px] font-medium leading-[1.25]"
            style={{
              color: c.textMuted,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {cta}
          </span>
        )}
      </span>
      {isLocked && <Lock size={14} style={{ color: c.textMuted }} />}
    </div>
  );
}

/** Sidebar entrance delays - sequenced after the header chips (desktop uiEnterUp cascade). */
const STEP_DELAYS = [0.34, 0.42, 0.5, 0.58];

interface HomeSplitProps {
  /** Inline panel currently shown (0=mfr, 1=board, 2=os, 3=device); -1 is the focus card. */
  activeStep: number;
  /** Number of committed selections (0-4), drives done/locked derivation. */
  step: number;
  /** Indices of completed steps (0-based), drives the focus checklist + done badges. */
  completed: number[];
  /** Pulses the about-to-be-selected card/row in the active panel. */
  clicking: boolean;
  /** OS image fetch in flight, so OsGallery renders its skeleton. */
  osLoading: boolean;
}

/** Two-column home: step sidebar plus the active inline panel or the focus card. */
export function HomeSplit({ activeStep, step, completed, clicking, osLoading }: HomeSplitProps) {
  const c = useC();
  const { data, sel } = useD();

  const mfg = selMfg(data, sel);
  const board = selBoard(data, sel);
  const os = selOs(data, sel);

  // Selection values surface only once the corresponding step is committed (step counter).
  const mfgValue = step > 0 ? <MarqueeText text={mfg.name} /> : undefined;
  const boardValue = step > 1 ? <MarqueeText text={board.name} /> : undefined;
  const osValue = step > 2 && os ? <MarqueeText text={formatOsIdentity(os)} /> : undefined;

  /** Derive a step's visual state: done if committed, active if current, else locked. */
  const stateOf = (i: number): StepState => {
    if (i < step) return 'done';
    if (i === activeStep || i === step) return 'active';
    return 'locked';
  };

  const steps: SideStepData[] = [
    {
      key: 'manufacturer',
      index: 1,
      icon: Factory,
      label: 'Manufacturer',
      cta: 'Choose brand',
      value: mfgValue,
      state: stateOf(0),
    },
    {
      key: 'board',
      index: 2,
      icon: Cpu,
      label: 'Board',
      cta: 'Choose board',
      value: boardValue,
      state: stateOf(1),
    },
    {
      key: 'image',
      index: 3,
      icon: Database,
      label: 'Operating System',
      cta: 'Choose OS',
      value: osValue,
      state: stateOf(2),
    },
    {
      key: 'device',
      index: 4,
      icon: HardDrive,
      label: 'Storage',
      cta: 'Choose storage',
      value: undefined,
      state: stateOf(3),
    },
  ];

  // Confirm phase (device committed) collapses the sidebar and lets the panel go full-bleed.
  const fullBleed = activeStep === 3 && step >= 4;

  // Active inline panel for the current step; null falls through to the FocusCard.
  const panel = (() => {
    switch (activeStep) {
      case 0:
        return <MfrPanel clicking={clicking} />;
      case 1:
        return <BoardPanel clicking={clicking} />;
      case 2:
        return <OsGallery clicking={clicking} loading={osLoading} />;
      case 3:
        return <DevicePanel mode={fullBleed ? 'confirm' : 'list'} clicking={clicking} />;
      default:
        return null;
    }
  })();

  const islandSurface: React.CSSProperties = {
    background: c.islandBg,
    border: `1px solid ${c.islandBorder}`,
    borderRadius: 22,
    boxShadow: c.shadowHeavy,
    backdropFilter: 'blur(18px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
  };

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center">
      <div
        className="grid h-full min-h-0 w-full mockup-split-in"
        style={{
          gridTemplateColumns: fullBleed ? '0 1fr' : '280px 1fr',
          gap: fullBleed ? 0 : 16,
          padding: '4px 18px 18px 24px',
          transition:
            'grid-template-columns 0.5s cubic-bezier(0.16,1,0.3,1), gap 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <aside
          className="flex flex-col p-[18px_14px]"
          style={{
            ...islandSurface,
            opacity: fullBleed ? 0 : 1,
            transform: fullBleed ? 'translateX(-24px)' : 'none',
            overflow: 'hidden',
            minWidth: 0,
            pointerEvents: fullBleed ? 'none' : undefined,
            transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <nav className="flex flex-col gap-1">
            {steps.map((s, i) => (
              <SideStep key={s.key} data={s} delay={STEP_DELAYS[i]!} />
            ))}
          </nav>

          {/* Bottom cluster: custom-image link (pre-manufacturer) + persistent "what's new" promo,
              mirroring the desktop sidebar footer. */}
          <div className="mt-auto flex flex-col gap-2 pt-3">
            {step === 0 && (
              <span
                className="inline-flex w-full items-center justify-center gap-[7px] rounded-[9px] border px-3 py-[9px] text-[12.5px] font-medium"
                style={{ borderColor: c.border, color: c.textSec, background: 'transparent' }}
              >
                <FolderOpen size={15} style={{ opacity: 0.8 }} />
                Use Custom Image
              </span>
            )}
            <span
              className="inline-flex w-full items-center gap-[10px] rounded-[10px] border border-dashed px-3 py-[10px] text-[12.5px] font-medium"
              style={{ borderColor: c.border, color: c.textSec, background: 'transparent' }}
            >
              <span
                className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full"
                style={{ background: `rgba(${ACCENT_RGB},0.14)`, color: ACCENT }}
              >
                <Lightbulb size={14} />
              </span>
              <span className="min-w-0 flex-1 leading-[1.25]">
                What&apos;s new in Armbian v26.2?
              </span>
              <ExternalLink size={14} className="shrink-0" style={{ color: c.textMuted }} />
            </span>
          </div>
        </aside>

        <section
          className="relative flex min-h-0 min-w-0 overflow-hidden"
          style={{
            ...islandSurface,
            alignItems: panel ? 'stretch' : 'center',
            justifyContent: panel ? 'stretch' : 'center',
            padding: panel ? 0 : 'clamp(20px,4vw,36px)',
          }}
        >
          {panel ? (
            <div key={`panel-${activeStep}`} className="flex min-h-0 w-full mockup-split-in">
              {panel}
            </div>
          ) : (
            <FocusCard activeStep={activeStep} step={step} completed={completed} />
          )}
        </section>
      </div>
    </div>
  );
}
