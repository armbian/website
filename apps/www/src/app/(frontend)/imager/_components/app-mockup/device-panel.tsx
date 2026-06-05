'use client';

import type { CSSProperties } from 'react';
import { TriangleAlert, Shield, MemoryStick, RefreshCw, ArrowRight, HardDrive } from 'lucide-react';
import { useC } from './theme';
import { useD, selMfg, selBoard, selOs } from './data';
import { ACCENT, ACCENT_RGB, formatOsIdentity } from './constants';
import { BoardImage } from './image-components';
import { MarqueeText } from './home-split';

/** Hardcoded SD reader: the demo has no real device probe. */
const DEMO_DEVICE = {
  name: 'Built In SDXC Reader',
  node: 'disk6',
  size: '14.8 GB',
} as const;

interface DevicePanelProps {
  /** `list` shows the device picker; `confirm` shows the erase summary for the selected board. */
  mode: 'list' | 'confirm';
  /** Pulses the about-to-be-selected row (list) or the Erase action (confirm) during auto-play. */
  clicking?: boolean;
}

/** Inline storage step, mirroring the desktop DevicePanel. */
export function DevicePanel({ mode, clicking = false }: DevicePanelProps) {
  if (mode === 'confirm') return <DeviceConfirm clicking={clicking} />;
  return <DeviceList clicking={clicking} />;
}

function DeviceList({ clicking }: { clicking: boolean }) {
  const c = useC();

  return (
    <div className="mfr-panel device-panel flex h-full w-full flex-col">
      {/* Data-loss alert with a decorative-only system-devices toggle. */}
      <div className="flex shrink-0 flex-wrap items-center gap-[12px] px-[22px] pb-[12px] pt-[18px]">
        <div
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[12px] gap-y-[10px] rounded-[8px] py-[10px] pl-[14px] pr-[12px]"
          style={{ background: c.deviceAlertBg, border: `1px solid ${c.deviceAlertBorder}` }}
        >
          <span
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]"
            style={{ background: 'rgba(239,68,68,0.16)', color: c.deviceAlertIcon }}
          >
            <TriangleAlert size={16} />
          </span>
          <span
            className="min-w-[120px] flex-1 text-[13.5px] font-semibold leading-[1.3]"
            style={{ color: c.text }}
          >
            All data on the selected device will be erased
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[9px] px-[13px] py-[8px] text-[12.5px] font-semibold"
            style={{ background: c.bgCard, border: `1px solid ${c.border}`, color: c.textSec }}
          >
            <Shield size={14} />
            <span>Show system drives</span>
          </span>
        </div>
      </div>

      {/* The demo exposes only one SD row plus a refresh control. */}
      <div className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto px-[22px] pb-[22px] pt-[10px]">
        <div className="flex flex-col gap-[10px]">
          <div
            className="flex w-full items-center gap-[14px] rounded-[12px] px-[16px] py-[13px] text-left"
            style={{
              background: c.bgCard,
              border: `1px solid ${clicking ? ACCENT : c.border}`,
              boxShadow: clicking ? c.cardHoverShadow : c.shadow,
              transform: clicking ? 'translateY(-2px)' : 'none',
              ...(clicking
                ? { outline: `1px solid rgba(${ACCENT_RGB},0.4)`, outlineOffset: '-1px' }
                : {}),
              transition:
                'transform .3s cubic-bezier(0.16,1,0.3,1), border-color .3s ease, box-shadow .3s ease',
            }}
          >
            <span
              className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[8px]"
              style={{ background: c.deviceIconBg, color: c.deviceIconColor }}
            >
              <MemoryStick size={22} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span
                className="flex items-center gap-[8px] text-[14.5px] font-semibold"
                style={{ color: c.text }}
              >
                {DEMO_DEVICE.name}
                <span className="rounded-[12px] bg-[#3b82f6] px-[8px] py-[4px] text-[11px] font-bold uppercase text-white">
                  SD Card
                </span>
              </span>
              <span className="truncate text-[12.5px]" style={{ color: c.textMuted }}>
                {DEMO_DEVICE.node} • {DEMO_DEVICE.size}
              </span>
            </span>
            <ArrowRight
              size={18}
              className="shrink-0"
              style={{
                color: clicking ? ACCENT : c.textMuted,
                transform: clicking ? 'translateX(3px)' : 'none',
                transition: 'transform .2s ease, color .2s ease',
              }}
            />
          </div>
        </div>

        {/* Decorative refresh button. */}
        <div className="mt-auto flex justify-center pt-[12px]">
          <span
            className="inline-flex items-center gap-[8px] rounded-[11px] px-[18px] py-[10px] text-[13.5px] font-semibold"
            style={{ border: `1px solid ${c.border}`, background: 'transparent', color: c.text }}
          >
            <RefreshCw size={15} />
            Refresh Devices
          </span>
        </div>
      </div>
    </div>
  );
}

/** Confirm view: floating board hero + build/target summary + erase warning + actions. */
function DeviceConfirm({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const mfg = selMfg(data, sel);
  const board = selBoard(data, sel);
  const os = selOs(data, sel);

  const osIdentity = os ? formatOsIdentity(os) : 'Armbian';

  return (
    <div className="mfr-panel device-panel flex h-full w-full flex-col">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-[28px] py-[clamp(16px,4vh,36px)]">
        <div
          className="flex w-full max-w-[1060px] items-center justify-center gap-[clamp(36px,5vw,84px)] max-[820px]:flex-col"
          style={{ animation: 'mockup-content-in 0.45s cubic-bezier(0.16,1,0.3,1) 0.12s both' }}
        >
          {/* Left: floating board photo over a breathing accent halo. */}
          <div className="relative flex min-w-0 flex-1 items-center justify-center max-[820px]:order-first">
            <div
              className="absolute z-0 aspect-square w-[78%] rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${ACCENT_RGB},0.28) 0%, rgba(${ACCENT_RGB},0.1) 38%, transparent 70%)`,
                filter: 'blur(14px)',
                animation: 'mockup-confirm-glow 6s ease-in-out infinite',
              }}
            />
            <div
              className="relative z-[1] w-full max-w-[clamp(320px,38vw,480px)]"
              style={{
                filter: 'drop-shadow(0 30px 44px rgba(0,0,0,0.5))',
                animation: 'mockup-confirm-float 5.5s ease-in-out infinite',
              }}
            >
              <BoardImage slug={board.slug} name={board.name} />
            </div>
          </div>

          {/* Right: title, summary, warning, actions. */}
          <div className="flex min-w-0 max-w-[470px] flex-1 flex-col items-stretch text-left">
            <h2
              className="m-0 text-[clamp(24px,2.2vw,30px)] font-bold tracking-[-0.5px]"
              style={{ color: c.text }}
            >
              Confirm Selection
            </h2>
            <p className="mb-[22px] mt-[8px] text-[15px]" style={{ color: c.textSec }}>
              Take one last look before writing.
            </p>

            <ul
              className="m-0 mb-[18px] w-full list-none overflow-hidden rounded-[16px] p-0 text-left"
              style={{
                background: c.bgCard,
                border: `1px solid ${c.borderLight}`,
                boxShadow: c.shadow,
                color: c.text,
              }}
            >
              <SummaryRow label="Manufacturer" c={c}>
                <MarqueeText
                  text={mfg.name}
                  className="text-right text-[13.5px] font-semibold"
                  maxWidth={340}
                />
              </SummaryRow>
              <SummaryRow label="Board" c={c} divider={c.borderLight}>
                <MarqueeText
                  text={board.name}
                  className="text-right text-[13.5px] font-semibold"
                  maxWidth={340}
                />
              </SummaryRow>
              <SummaryRow label="Operating System" c={c} divider={c.borderLight}>
                <MarqueeText
                  text={osIdentity}
                  className="text-right text-[13.5px] font-semibold"
                  maxWidth={340}
                />
              </SummaryRow>
              <li
                className="flex items-center justify-between gap-[16px] px-[16px] py-[11px]"
                style={{ borderTop: `1px solid ${c.borderLight}` }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.5px]"
                  style={{ color: c.textMuted }}
                >
                  Storage
                </span>
                <span className="flex min-w-0 flex-col items-end gap-[2px] text-right">
                  <MarqueeText
                    text={DEMO_DEVICE.name}
                    className="text-[14px] font-bold"
                    maxWidth={300}
                  />
                  <span className="text-[12px]" style={{ color: c.textMuted }}>
                    {DEMO_DEVICE.node} • {DEMO_DEVICE.size}
                  </span>
                </span>
              </li>
            </ul>

            <div
              className="mb-[22px] inline-flex items-center gap-[8px] text-[12.5px] font-bold uppercase tracking-[0.4px]"
              style={{ color: '#ef4444' }}
            >
              <TriangleAlert size={15} />
              ALL DATA WILL BE PERMANENTLY ERASED
            </div>

            <div className="flex gap-[10px]">
              <span
                className="rounded-[8px] px-[24px] py-[11px] text-[14px] font-semibold"
                style={{
                  border: `1px solid ${c.border}`,
                  background: 'transparent',
                  color: c.text,
                }}
              >
                Cancel
              </span>
              <span
                className="inline-flex items-center gap-[8px] rounded-[8px] px-[24px] py-[11px] text-[14px] font-semibold text-white"
                style={{
                  border: 'none',
                  background: clicking ? '#dc2626' : '#ef4444',
                  boxShadow: '0 10px 22px -8px rgba(239,68,68,0.6)',
                  transform: clicking ? 'scale(0.97)' : 'none',
                  transition: 'background .18s ease, transform .18s ease, box-shadow .18s ease',
                }}
              >
                <HardDrive size={15} />
                Erase &amp; Flash
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A label/value summary row matching the desktop .device-summary__row eyebrow treatment. */
function SummaryRow({
  label,
  c,
  divider,
  children,
}: {
  label: string;
  c: ReturnType<typeof useC>;
  divider?: string;
  children: React.ReactNode;
}) {
  const style: CSSProperties = divider ? { borderTop: `1px solid ${divider}` } : {};
  return (
    <li className="flex items-center justify-between gap-[16px] px-[16px] py-[11px]" style={style}>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.5px]"
        style={{ color: c.textMuted }}
      >
        {label}
      </span>
      {children}
    </li>
  );
}
