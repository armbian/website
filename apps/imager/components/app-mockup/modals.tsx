'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Search,
  Download,
  Monitor,
  Terminal,
  Zap,
  HardDrive,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { useC } from './theme';
import { useD, selBoards, selOsImages } from './data';
import { ACCENT, DESKTOP_BADGES, KERNEL_BADGES, DEFAULT_COLOR, tierStyle } from './constants';
import { VendorLogo, BoardImage } from './image-components';

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useC();
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex w-full max-w-[850px] flex-col rounded-[12px]"
      style={{
        maxHeight: 480,
        background: c.bgCard,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadowHeavy,
      }}
    >
      <div
        className="flex items-center justify-between px-[20px] py-[16px]"
        style={{
          background: c.bgSec,
          borderBottom: `1px solid ${c.borderLight}`,
          borderRadius: '12px 12px 0 0',
        }}
      >
        <span className="text-[16px] font-semibold" style={{ color: c.text }}>
          {title}
        </span>
        <div
          className="flex items-center justify-center rounded-[4px] p-[4px]"
          style={{ color: c.textSec }}
        >
          <X className="h-[18px] w-[18px]" />
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function SBar({ placeholder }: { placeholder: string }) {
  const c = useC();
  return (
    <div className="px-[20px] py-[16px]" style={{ borderBottom: `1px solid ${c.borderLight}` }}>
      <div
        className="flex items-center gap-[10px] rounded-[8px] px-[14px] py-[10px]"
        style={{ border: `2px solid ${ACCENT}`, background: c.bgCard }}
      >
        <Search style={{ width: 18, height: 18, color: c.textDim, flexShrink: 0 }} />
        <span className="text-[14px]" style={{ color: c.textDim }}>
          {placeholder}
        </span>
      </div>
    </div>
  );
}

function scrollInContainer(el: HTMLElement | null) {
  if (!el) return;
  const container = el.closest('.mockup-scroll');
  if (!container) return;
  const cRect = container.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  if (eRect.top < cRect.top || eRect.bottom > cRect.bottom) {
    container.scrollTo({
      top: container.scrollTop + eRect.top - cRect.top - cRect.height / 2 + eRect.height / 2,
      behavior: 'smooth',
    });
  }
}

export function ManufacturerModal({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const targetRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const t = setTimeout(() => scrollInContainer(targetRef.current), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <Modal title="Select Manufacturer">
      <SBar placeholder="Search manufacturer..." />
      <div className="mockup-scroll flex flex-1 flex-col">
        {data.manufacturers.map((m, i) => {
          const selected = i === sel.mfgIdx && clicking;
          return (
            <motion.button
              ref={i === sel.mfgIdx ? targetRef : undefined}
              key={m.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
              className="flex w-full items-center gap-[14px] px-[20px] py-[14px] text-left transition-colors duration-200"
              style={{
                borderBottom: `1px solid ${c.borderLight}`,
                background: selected ? c.selectedBg : 'transparent',
              }}
            >
              <VendorLogo mfg={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold" style={{ color: c.text }}>
                  {m.name}
                </p>
                <p className="mt-[2px] text-[12px]" style={{ color: c.textSec }}>
                  {m.boardCount} boards
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Modal>
  );
}

export function BoardModal({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const boards = selBoards(data, sel);
  const targetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => scrollInContainer(targetRef.current), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <Modal title="Select Board">
      <SBar placeholder="Search boards..." />
      <div
        className="mockup-scroll p-[16px]"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
      >
        {boards.map((b, i) => {
          const isTarget = i === sel.boardIdx;
          const isClicking = isTarget && clicking;
          const style = tierStyle[b.tier] || tierStyle.community;
          return (
            <motion.div
              ref={isTarget ? targetRef : undefined}
              key={b.slug}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: isClicking ? 0.96 : 1 }}
              transition={{ delay: 0.15 + i * 0.035, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative flex flex-col items-center rounded-[12px] p-[12px] transition-colors duration-200"
              style={{
                background: isClicking ? c.clickBg : c.bgCard,
                border: isClicking ? `2px solid ${ACCENT}` : `1px solid ${c.border}`,
              }}
            >
              <div
                className="absolute top-[6px] right-[6px] z-10 flex items-center justify-center gap-[3px] rounded-full px-[6px]"
                style={{
                  height: 18,
                  background: '#ef4444',
                  fontSize: 10,
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                <Download style={{ width: 10, height: 10 }} />
                {b.imageCount}
              </div>
              <div className="relative mb-[10px] flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-[8px]">
                <BoardImage slug={b.slug} name={b.name} fill />
              </div>
              <div className="flex min-h-[50px] flex-col items-center justify-between gap-[2px]">
                <span
                  className="text-center text-[13px] font-semibold leading-[1.3]"
                  style={{ color: c.text }}
                >
                  {b.name}
                </span>
                <div className="flex flex-wrap justify-center gap-[4px]" style={{ minHeight: 20 }}>
                  <span
                    className="inline-flex items-center rounded-[10px] px-[8px] py-[3px] text-[9px] font-semibold uppercase tracking-[0.5px]"
                    style={{
                      background: style.bg,
                      color: style.color,
                      boxShadow:
                        b.tier === 'platinum'
                          ? '0 2px 8px rgba(251,191,36,0.5)'
                          : '0 2px 6px rgba(5,150,105,0.4)',
                    }}
                  >
                    {b.tier}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Modal>
  );
}

export function OsModal({ clicking }: { clicking: boolean }) {
  const c = useC();
  const { data, sel } = useD();
  const osImages = selOsImages(data, sel);
  const tabs = ['All Images', 'Recommended', 'Stable', 'Nightly', 'Apps', 'Barebone'];
  const targetRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const t = setTimeout(() => scrollInContainer(targetRef.current), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <Modal title="Select Operating System">
      <div
        className="flex gap-[8px] px-[20px] py-[16px]"
        style={{ borderBottom: `1px solid ${c.borderLight}` }}
      >
        {tabs.map((t, i) => {
          const active = i === 0;
          return (
            <div
              key={t}
              className="whitespace-nowrap rounded-[20px] px-[18px] py-[10px] text-[13px] font-semibold"
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg,#f97316,#ea580c)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
                    }
                  : {
                      background: c.inactiveTabBg,
                      border: c.inactiveTabBorder,
                      color: c.textSec,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }
              }
            >
              {t}
            </div>
          );
        })}
      </div>
      <div className="mockup-scroll flex flex-1 flex-col">
        {osImages.map((os, i) => {
          const deColor = DESKTOP_BADGES[os.deKey] || DEFAULT_COLOR;
          const kColor = KERNEL_BADGES[os.kernelKey] || DEFAULT_COLOR;
          const selected = i === sel.osIdx && clicking;
          return (
            <motion.button
              ref={i === sel.osIdx ? targetRef : undefined}
              key={`${i}-${os.deKey}-${os.kernelKey}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
              className="flex w-full items-center gap-[14px] px-[20px] py-[14px] text-left transition-colors duration-200"
              style={{
                borderBottom: `1px solid ${c.borderLight}`,
                background: selected ? c.selectedBg : 'transparent',
              }}
            >
              <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center">
                {os.distro === 'ubuntu' ? (
                  <Image
                    src="/assets/ubuntu.png"
                    alt="Ubuntu"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src="/assets/debian.svg"
                    alt="Debian"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="mb-[2px] truncate text-[14px] font-semibold"
                  style={{ color: c.text }}
                >
                  {os.name}
                </p>
                <div className="mt-[6px] flex flex-wrap items-center gap-[8px]">
                  <span
                    className="inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[11px] font-semibold"
                    style={{
                      background: `linear-gradient(135deg,${deColor},${deColor})`,
                      color: '#fff',
                      boxShadow: `0 2px 6px ${deColor}66`,
                    }}
                  >
                    {os.deKey === 'cli' ? (
                      <Terminal style={{ width: 11, height: 11 }} />
                    ) : (
                      <Monitor style={{ width: 11, height: 11 }} />
                    )}
                    {os.de}
                  </span>
                  <span
                    className="inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[11px] font-semibold"
                    style={{
                      background: `linear-gradient(135deg,${kColor},${kColor})`,
                      color: '#fff',
                      boxShadow: `0 2px 6px ${kColor}66`,
                    }}
                  >
                    <Zap style={{ width: 11, height: 11 }} />
                    {os.kernel}
                  </span>
                </div>
              </div>
              <div
                className="flex shrink-0 items-center gap-[4px] rounded-[10px] px-[10px] text-[11px] font-semibold tracking-[0.3px]"
                style={{
                  height: 24,
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  color: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                }}
              >
                <Download style={{ width: 11, height: 11 }} />
                {os.size}
              </div>
            </motion.button>
          );
        })}
      </div>
    </Modal>
  );
}

export function StorageModal({ clicking }: { clicking: boolean }) {
  const c = useC();
  return (
    <Modal title="Select Storage Device">
      <div
        className="flex items-center justify-between gap-[16px] px-[16px] py-[12px]"
        style={{ background: c.warningBg, borderBottom: `1px solid ${c.warningBorder}` }}
      >
        <div className="flex items-center gap-[12px]">
          <div
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: 'rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle style={{ width: 16, height: 16, color: '#cc3333' }} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: c.text }}>
            All data on selected device will be erased
          </span>
        </div>
        <div
          className="inline-flex shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[8px] px-[12px] py-[6px] text-[12px] font-semibold"
          style={{ border: `1px solid ${c.border}`, background: c.bgSec, color: c.textSec }}
        >
          <div
            className="h-[14px] w-[14px] rounded-full"
            style={{ border: `2px solid ${c.textMuted}` }}
          />
          Show system drives
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex w-full items-center gap-[14px] px-[20px] py-[14px] text-left transition-all duration-200"
          style={{
            borderBottom: `1px solid ${c.borderLight}`,
            background: clicking ? c.selectedBg : 'transparent',
            boxShadow: clicking ? `inset 0 0 0 2px ${ACCENT}` : 'none',
          }}
        >
          <div
            className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: c.deviceIconBg }}
          >
            <HardDrive style={{ width: 24, height: 24, color: c.deviceIconColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[8px]">
              <p className="mb-[2px] text-[14px] font-semibold" style={{ color: c.text }}>
                Built In SDXC Reader
              </p>
              <span
                className="inline-flex items-center rounded-[12px] px-[8px] py-[4px] text-[11px] font-bold uppercase"
                style={{ background: '#3b82f6', color: '#fff' }}
              >
                SD CARD
              </span>
            </div>
            <p className="text-[12px]" style={{ color: c.textSec }}>
              disk6 · 14.8 GB
            </p>
          </div>
        </motion.button>
      </div>
      <div
        className="flex justify-center px-[20px] py-[16px]"
        style={{ borderTop: `1px solid ${c.borderLight}` }}
      >
        <div
          className="inline-flex items-center gap-[8px] rounded-[8px] px-[20px] py-[10px] text-[13px] font-semibold"
          style={{ background: c.bgSec, border: `1px solid ${c.border}`, color: c.text }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} />
          Refresh Devices
        </div>
      </div>
    </Modal>
  );
}

export function ConfirmModal({ clicking }: { clicking: boolean }) {
  const c = useC();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex w-full max-w-[400px] flex-col items-center rounded-[12px] p-[24px] text-center"
      style={{ background: c.bgCard, border: `1px solid ${c.border}`, boxShadow: c.shadowHeavy }}
    >
      <div className="mb-[16px]">
        <AlertTriangle style={{ width: 32, height: 32, color: '#fbbf24' }} />
      </div>
      <h3 className="mb-[8px] text-[18px] font-semibold" style={{ color: c.text }}>
        Confirm Selection
      </h3>
      <p className="mb-[12px] text-[14px]" style={{ color: c.textSec }}>
        You are about to write to:
      </p>
      <div
        className="mb-[16px] flex w-full flex-col items-center gap-[4px] rounded-[8px] px-[12px] py-[12px]"
        style={{ background: c.bgSec }}
      >
        <span className="text-[14px] font-semibold" style={{ color: c.text }}>
          Built In SDXC Reader
        </span>
        <span className="text-[12px]" style={{ color: c.textSec }}>
          disk6 (14.8 GB)
        </span>
      </div>
      <p className="mb-[20px] text-[12px] font-bold uppercase" style={{ color: '#ef4444' }}>
        ALL DATA WILL BE PERMANENTLY ERASED
      </p>
      <div className="flex gap-[12px]">
        <div
          className="inline-flex items-center justify-center rounded-[6px] px-[24px] py-[10px] text-[13px] font-semibold"
          style={{ background: c.bgSec, border: `1px solid ${c.border}`, color: c.text }}
        >
          Cancel
        </div>
        <div
          className="inline-flex items-center justify-center rounded-[6px] px-[24px] py-[10px] text-[13px] font-semibold transition-all duration-150"
          style={{
            background: clicking ? '#dc2626' : '#ef4444',
            color: '#fff',
            transform: clicking ? 'scale(0.95)' : 'scale(1)',
            boxShadow: clicking ? '0 0 0 3px rgba(239,68,68,0.4)' : 'none',
          }}
        >
          Erase & Flash
        </div>
      </div>
    </motion.div>
  );
}
