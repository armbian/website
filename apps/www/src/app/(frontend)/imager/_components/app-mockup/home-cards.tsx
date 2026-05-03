'use client';

import { useRef, useEffect, useState } from 'react';
import { Check, Factory, Cpu, Database, HardDrive, FolderOpen } from 'lucide-react';
import { useC } from './theme';
import { useD, selMfg, selBoard, selOs } from './data';
import { STEPS, ACCENT, ACCENT_RGB, GREEN } from './constants';

const MARQUEE_MAX_WIDTH = 180;
const MARQUEE_SEPARATOR_WIDTH = 5;

function MarqueeText({ text, color }: { text: string; color: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(50);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return;

      const computedStyle = window.getComputedStyle(containerRef.current);
      const measureSpan = document.createElement('span');
      measureSpan.style.cssText = `
        position: absolute; visibility: hidden; white-space: nowrap;
        font-family: ${computedStyle.fontFamily}; font-size: ${computedStyle.fontSize};
        font-weight: ${computedStyle.fontWeight}; letter-spacing: ${computedStyle.letterSpacing};
        text-transform: ${computedStyle.textTransform};
      `;
      measureSpan.textContent = text;

      let singleTextWidth = 0;
      try {
        document.body.appendChild(measureSpan);
        singleTextWidth = measureSpan.offsetWidth;
      } finally {
        measureSpan.parentNode?.removeChild(measureSpan);
      }

      const overflow = singleTextWidth > MARQUEE_MAX_WIDTH;
      setIsOverflow(overflow);

      if (overflow) {
        const scrollDistance = singleTextWidth + MARQUEE_SEPARATOR_WIDTH;
        const totalWidth = scrollDistance * 2;
        setScrollPercent((scrollDistance / totalWidth) * 100);
      }
    };

    const timer = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <span
      ref={containerRef}
      className={`mockup-marquee-container ${isOverflow ? 'overflow' : ''}`}
      style={
        {
          maxWidth: MARQUEE_MAX_WIDTH,
          color,
          fontSize: 15,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        } as React.CSSProperties
      }
      title={text}
    >
      <span
        className="mockup-marquee-content"
        style={
          isOverflow
            ? ({ '--scroll-percent': `-${scrollPercent}%` } as React.CSSProperties)
            : undefined
        }
      >
        {text}
        {isOverflow && <>&nbsp;{text}</>}
      </span>
    </span>
  );
}

export function StepPills({ completed }: { completed: number[] }) {
  const c = useC();
  return (
    <div
      className="flex items-center gap-[3px] rounded-[10px] px-[10px] py-[7px]"
      style={{ background: c.pillsBg, border: `1px solid ${c.pillsBorder}` }}
    >
      {STEPS.map((s, i) => {
        const done = completed.includes(i);
        return (
          <div
            key={s}
            className="flex items-center gap-[5px] rounded-[8px] px-[8px] py-[4px] sm:px-[10px]"
            style={done ? { background: 'rgba(34,197,94,0.15)' } : undefined}
          >
            <div
              className="flex h-[20px] w-[20px] items-center justify-center rounded-full text-[10px] font-bold"
              style={
                done
                  ? { background: GREEN, color: '#fff' }
                  : { background: c.pillStepBg, color: c.pillStepColor }
              }
            >
              {done ? <Check className="h-[11px] w-[11px]" /> : i + 1}
            </div>
            <span
              className="hidden text-[11px] font-medium uppercase tracking-[0.3px] sm:inline"
              style={{ color: done ? GREEN : c.pillStepColor }}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HomeCards({
  activeCard,
  clicking,
  step,
}: {
  activeCard: number;
  clicking: boolean;
  step: number;
}) {
  const c = useC();
  const { data, sel } = useD();
  const mfg = selMfg(data, sel);
  const board = selBoard(data, sel);
  const os = selOs(data, sel);
  const kType = os ? (os.kernel.split(' ')[0] ?? '').toLowerCase() : '';
  const btns = [
    {
      label: 'MANUFACTURER',
      text: 'CHOOSE BRAND',
      Icon: Factory,
      filled: { text: mfg.name.toUpperCase(), sub: '' },
    },
    {
      label: 'BOARD',
      text: 'CHOOSE BOARD',
      Icon: Cpu,
      filled: { text: board.name.toUpperCase(), sub: `${board.imageCount} images` },
    },
    {
      label: 'OPERATING SYSTEM',
      text: 'CHOOSE OS',
      Icon: Database,
      filled: { text: os?.de || 'CLI', sub: os ? `${os.name.split(' ').pop()} · ${kType}` : '' },
    },
    {
      label: 'STORAGE',
      text: 'CHOOSE STORAGE',
      Icon: HardDrive,
      filled: { text: 'BUILT IN SDXC READER', sub: '14.8 GB' },
    },
  ];
  return (
    <>
      <div className="flex w-full justify-center gap-[20px]">
        {btns.map((b, i) => {
          const isFilled = i < step;
          const isActive = i === activeCard;
          const isClicking = isActive && clicking;
          const highlighted = isFilled || isActive;
          return (
            <div
              key={b.label}
              className="flex w-full min-w-0 max-w-[280px] flex-col items-center gap-[10px]"
            >
              <span
                className="text-center text-[11px] font-bold uppercase tracking-[0.8px]"
                style={{ color: c.textDim }}
              >
                {b.label}
              </span>
              <div
                className="flex w-full flex-col items-center justify-center gap-[6px] overflow-hidden rounded-[12px] transition-all duration-200"
                style={{
                  height: 140,
                  padding: '20px 16px',
                  background: isClicking ? c.clickBg : c.bgCard,
                  border: `2px solid ${highlighted ? ACCENT : c.border}`,
                  boxShadow: isClicking
                    ? `0 0 0 4px rgba(${ACCENT_RGB},0.4), 0 0 20px rgba(${ACCENT_RGB},0.2)`
                    : highlighted
                      ? `0 0 0 3px rgba(${ACCENT_RGB},0.25)`
                      : c.shadow,
                  transform: isClicking ? 'scale(0.96)' : 'scale(1)',
                }}
              >
                <b.Icon
                  style={{ width: 36, height: 36, color: highlighted ? ACCENT : c.textDim2 }}
                />
                {isFilled ? (
                  <>
                    <MarqueeText text={b.filled.text} color={ACCENT} />
                    {b.filled.sub && (
                      <span className="text-[12px]" style={{ color: c.textSec }}>
                        {b.filled.sub}
                      </span>
                    )}
                  </>
                ) : (
                  <span
                    className="text-center text-[15px] font-bold uppercase tracking-[0.4px]"
                    style={{ color: highlighted ? ACCENT : c.textDim2, maxWidth: 180 }}
                  >
                    {b.text}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="flex items-center gap-[6px] rounded-[6px] px-[14px] py-[6px]"
        style={{ border: `1px solid ${c.border}`, color: c.textSec }}
      >
        <FolderOpen className="h-[14px] w-[14px]" style={{ opacity: 0.7 }} />
        <span className="text-[11px] font-medium">Use Custom Image</span>
      </div>
    </>
  );
}
