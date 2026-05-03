'use client';

import { motion } from 'framer-motion';
import { Check, HardDrive, Download } from 'lucide-react';
import Image from 'next/image';
import { useC } from './theme';
import { useD, selBoard, selOs } from './data';
import { ACCENT, FLASH_STAGES } from './constants';
import { BoardImage } from './image-components';

export function FlashHeader() {
  const c = useC();
  const { data, sel } = useD();
  const board = selBoard(data, sel);
  const os = selOs(data, sel);
  const osLogo = os?.distro === 'debian' ? '/assets/debian.svg' : '/assets/ubuntu.png';
  return (
    <div
      className="flex w-full items-center gap-[20px] rounded-[10px] px-[24px] py-[20px]"
      style={{
        maxWidth: 620,
        background: c.bgCard,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
      }}
    >
      <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[8px]">
        <BoardImage slug={board.slug} name={board.name} fill />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
        <h2 className="m-0 text-[20px] font-semibold leading-[1.2]" style={{ color: c.text }}>
          {board.name}
        </h2>
        <div className="flex flex-wrap items-center gap-[8px]">
          <div
            className="inline-flex items-center gap-[6px] rounded-full py-[4px] pr-[10px] pl-[6px]"
            style={{ background: c.bgSec, border: `1px solid ${c.border}` }}
          >
            <Image
              src={osLogo}
              alt={os?.distro || 'linux'}
              width={20}
              height={20}
              className="shrink-0 object-contain"
            />
            <span className="truncate text-[12px] font-medium" style={{ color: c.textSec }}>
              {os?.name || 'Armbian'}
            </span>
          </div>
          <div
            className="inline-flex items-center gap-[6px] rounded-full py-[4px] pr-[10px] pl-[8px]"
            style={{
              background: 'rgba(242,101,34,0.08)',
              border: '1px solid rgba(242,101,34,0.2)',
            }}
          >
            <HardDrive style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />
            <span className="text-[12px] font-semibold" style={{ color: ACCENT }}>
              Built In SDXC Reader
            </span>
            <span
              className="text-[11px]"
              style={{
                color: c.textSec,
                marginLeft: 4,
                paddingLeft: 8,
                borderLeft: '1px solid rgba(242,101,34,0.2)',
              }}
            >
              14.8 GB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlashStatus({ stage, progress }: { stage: number; progress: number }) {
  const c = useC();
  const current = FLASH_STAGES[stage];
  const StageIcon = current.icon;
  const isIndeterminate = current.indeterminate;
  return (
    <div
      className="flex w-full flex-col items-center justify-center rounded-[10px] px-[24px] py-[24px]"
      style={{
        maxWidth: 620,
        minHeight: 140,
        background: c.bgCard,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <StageIcon style={{ width: 32, height: 32, color: ACCENT }} />
      </motion.div>
      <h3 className="mt-[10px] mb-0 text-[16px] font-semibold" style={{ color: c.text }}>
        {current.label}
      </h3>
      <div className="mt-[16px] flex w-full items-center gap-[16px]">
        <div
          className="relative h-[10px] flex-1 overflow-hidden rounded-[6px]"
          style={{
            background: c.bgSec,
            border: `1px solid ${c.borderLight}`,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {isIndeterminate ? (
            <div
              className="mockup-indeterminate absolute inset-y-0 left-0 rounded-[6px]"
              style={{
                width: '30%',
                background: `linear-gradient(90deg,#f97316,${ACCENT},#f97316)`,
              }}
            />
          ) : (
            <>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-[6px]"
                style={{
                  background: `linear-gradient(90deg,${ACCENT},#ff8c42)`,
                  boxShadow: '0 0 10px rgba(242,101,34,0.4)',
                }}
                animate={{ width: `${Math.max(progress, 0)}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
              <div className="mockup-shimmer absolute inset-0" />
            </>
          )}
        </div>
        {!isIndeterminate && (
          <span
            className="min-w-[50px] text-right text-[15px] font-bold tabular-nums"
            style={{ color: c.text }}
          >
            {Math.max(progress, 0)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function DoneView({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const board = selBoard(data, sel);
  return (
    <div
      className="flex w-full flex-col items-center gap-[14px] px-6"
      style={{ maxWidth: 620, margin: '0 auto' }}
    >
      <FlashHeader />
      <div
        className="flex w-full flex-col items-center justify-center rounded-[10px] px-[24px] py-[24px]"
        style={{
          minHeight: 140,
          background: c.bgCard,
          border: `1px solid ${c.border}`,
          boxShadow: c.shadow,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
        >
          <Check style={{ width: 32, height: 32, color: '#10b981' }} />
        </motion.div>
        <h3 className="mt-[10px] mb-0 text-[16px] font-semibold" style={{ color: c.text }}>
          Flash complete!
        </h3>
        <p
          className="mt-[8px] text-center text-[14px] leading-relaxed"
          style={{ color: c.textSec }}
        >
          Your SD card is ready! You can safely remove the device and insert it into your{' '}
          {board.name}.
        </p>
        <div className="mt-[20px] flex gap-[12px]">
          <div
            className="inline-flex items-center justify-center rounded-[6px] px-[20px] py-[10px] text-[13px] font-semibold"
            style={{ background: c.bgSec, border: `1px solid ${c.border}`, color: c.text }}
          >
            Flash Another
          </div>
          <div
            className="inline-flex items-center justify-center rounded-[6px] px-[20px] py-[10px] text-[13px] font-semibold transition-all duration-150"
            style={{
              background: clicking ? '#e55a1c' : ACCENT,
              color: '#fff',
              transform: clicking ? 'scale(0.95)' : 'scale(1)',
              boxShadow: clicking ? '0 0 0 3px rgba(242,101,34,0.4)' : 'none',
            }}
          >
            Done
          </div>
        </div>
      </div>
    </div>
  );
}
