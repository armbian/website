'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { ThemeCtx, darkT, lightT } from './theme';
import { DataCtx, processApiData, makeSelection, selMfg } from './data';
import { BOARD_CDN, FLASH_STAGES, isModal } from './constants';
import { apiClient } from '@/lib/api';
import { StepPills, HomeCards } from './home-cards';
import { ManufacturerModal, BoardModal, OsModal, StorageModal, ConfirmModal } from './modals';
import { FlashHeader, FlashStatus, DoneView } from './flash-views';
import type { ArmbianData, Selection, Phase } from './types';

const PRELOAD_BOARDS = 6;

const PHASE_TO_CARD: Partial<Record<Phase, number>> = {
  manufacturer: 0,
  board: 1,
  os: 2,
  storage: 3,
  confirm: 3,
};

export function AppMockup() {
  const { resolvedTheme } = useTheme();
  const c = resolvedTheme === 'light' ? lightT : darkT;
  const prefersReducedMotion = useReducedMotion();

  const [apiData, setApiData] = useState<ArmbianData | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [phase, setPhase] = useState<Phase>('home');
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [flashStage, setFlashStage] = useState(0);
  const [clicking, setClicking] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch the board catalog on mount. Skip when the user has reduced
  // motion enabled — the mockup renders nothing for them, no point
  // pulling 96 KB of JSON they will never see.
  useEffect(() => {
    if (prefersReducedMotion) return;
    let alive = true;
    apiClient
      .getBoards({ limit: 500 })
      .then(({ data }) => {
        if (!alive) return;
        const processed = processApiData(data);
        if (processed.manufacturers.length > 0) {
          setApiData(processed);
          setSelection(makeSelection(processed));
        } else {
          setFetchError(true);
        }
      })
      .catch((err) => {
        if (!alive) return;
        // eslint-disable-next-line no-console
        console.error('[AppMockup] getBoards error:', err);
        setFetchError(true);
      });
    return () => {
      alive = false;
    };
  }, [prefersReducedMotion]);

  // Preload only the assets the next animation cycle actually needs:
  // the current manufacturer's logo plus the first few of its boards.
  // The previous version eagerly preloaded every logo and every board
  // image of the selected manufacturer (up to 80+ requests per switch).
  const mfgIdx = selection?.mfgIdx;
  useEffect(() => {
    if (!apiData || !selection) return;
    const mfg = selMfg(apiData, selection);
    const boards = (apiData.boardsByMfg[mfg.id] || []).slice(0, PRELOAD_BOARDS);
    const urls: string[] = [];
    if (mfg.logo) urls.push(mfg.logo);
    for (const b of boards) urls.push(`${BOARD_CDN}/${b.slug}.png`);
    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, [apiData, mfgIdx]);

  const completed = Array.from({ length: Math.min(step, 4) }, (_, i) => i);
  const activeCard = phase === 'home' ? step : (PHASE_TO_CARD[phase] ?? -1);

  const advance = useCallback(() => {
    setClicking(false);
    if (phase === 'home') {
      const modalForStep: Phase[] = ['manufacturer', 'board', 'os', 'storage'];
      setPhase(modalForStep[step] || 'manufacturer');
    } else if (phase === 'manufacturer') {
      setStep(1);
      setPhase('home');
    } else if (phase === 'board') {
      setStep(2);
      setPhase('home');
    } else if (phase === 'os') {
      setStep(3);
      setPhase('home');
    } else if (phase === 'storage') {
      setPhase('confirm');
    } else if (phase === 'confirm') {
      setStep(4);
      setFlashStage(0);
      setPhase('flashing');
    } else if (phase === 'flashing') {
      setPhase('done');
    } else if (phase === 'done') {
      setPhase('reset');
    } else if (phase === 'reset') {
      setStep(0);
      if (apiData) setSelection((prev) => makeSelection(apiData, prev));
      setPhase('home');
    }
  }, [phase, step, apiData]);

  useEffect(() => {
    if (!apiData || !selection) return;
    const viewMs: Record<Phase, number> = {
      home: step === 0 ? 1500 : 900,
      manufacturer: 1800,
      board: 2200,
      os: 1800,
      storage: 1800,
      confirm: 1800,
      flashing: 13100,
      done: 2000,
      reset: 400,
    };
    const clickMs = 600;
    const needsClick = phase === 'home' || isModal(phase) || phase === 'done';
    if (needsClick) {
      const t1 = setTimeout(() => setClicking(true), viewMs[phase]);
      const t2 = setTimeout(advance, viewMs[phase] + clickMs);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      const t = setTimeout(advance, viewMs[phase]);
      return () => clearTimeout(t);
    }
  }, [phase, step, advance, apiData, selection]);

  useEffect(() => {
    if (phase !== 'flashing') {
      setProgress(phase === 'done' ? 100 : 0);
      setFlashStage(0);
      return;
    }
    setProgress(0);
    setFlashStage(0);
    const stageMs = [2500, 1200, 1400, 5000, 3000];
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    stageMs.forEach((_ms, i) => {
      if (i > 0) {
        elapsed += stageMs[i - 1];
        timers.push(setTimeout(() => setFlashStage(i), elapsed));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'flashing') return;
    const stage = FLASH_STAGES[flashStage];
    if (stage.indeterminate) {
      setProgress(-1);
      return;
    }
    setProgress(0);
    let n = 0;
    const total = flashStage === 0 ? 60 : flashStage === 3 ? 100 : 60;
    const interval = flashStage === 3 ? 48 : 40;
    const t = setInterval(() => {
      n++;
      setProgress(Math.min(Math.round((n / total) * 100), 100));
      if (n >= total) clearInterval(t);
    }, interval);
    return () => clearInterval(t);
  }, [phase, flashStage]);

  if (prefersReducedMotion) return null;

  if (fetchError) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Unable to load the app preview right now.
      </p>
    );
  }

  if (!apiData || !selection) return null;

  const homeVisible = phase === 'home' || isModal(phase);

  return (
    <ThemeCtx.Provider value={c}>
      <DataCtx.Provider value={{ data: apiData, sel: selection }}>
        <div
          className="mx-auto w-full max-w-5xl isolate pointer-events-none select-none overflow-hidden rounded-xl text-left shadow-2xl"
          style={{ background: c.bgApp }}
        >
          <div
            className="relative z-[70] flex items-center justify-center py-[10px]"
            style={{ background: c.titleBarBg, borderBottom: `1px solid ${c.titleBarBorder}` }}
          >
            <div className="absolute left-4 flex gap-[7px]">
              <span
                className="block h-[12px] w-[12px] rounded-full"
                style={{ background: '#ff5f57' }}
              />
              <span
                className="block h-[12px] w-[12px] rounded-full"
                style={{ background: '#febc2e' }}
              />
              <span
                className="block h-[12px] w-[12px] rounded-full"
                style={{ background: '#28c840' }}
              />
            </div>
            <span className="text-[12px] font-medium" style={{ color: c.titleBarText }}>
              Armbian Imager
            </span>
          </div>

          <div className="relative">
            <div
              className="flex items-center justify-between px-5 py-[14px] sm:px-7"
              style={{ background: c.bgApp, borderBottom: `1px solid ${c.borderLight}` }}
            >
              <Image
                src="/assets/armbian-logo.png"
                alt="Armbian"
                width={340}
                height={52}
                className="h-[38px] w-auto sm:h-[48px]"
                style={{ filter: c.logoFilter }}
              />
              <StepPills completed={completed} />
            </div>

            <div className="relative" style={{ height: 560, background: c.bgApp }}>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 transition-opacity duration-300 sm:px-8"
                style={{ opacity: homeVisible ? 1 : 0 }}
              >
                <HomeCards
                  activeCard={activeCard}
                  clicking={clicking && phase === 'home'}
                  step={step}
                />
              </div>

              <AnimatePresence>
                {phase === 'flashing' && (
                  <motion.div
                    key="fl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[14px] px-6"
                    style={{ background: c.bgApp }}
                  >
                    <FlashHeader />
                    <FlashStatus stage={flashStage} progress={progress} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === 'done' && (
                  <motion.div
                    key="dn"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex items-center justify-center px-6"
                    style={{ background: c.bgApp }}
                  >
                    <DoneView clicking={clicking} />
                  </motion.div>
                )}
              </AnimatePresence>

              {phase !== 'flashing' && phase !== 'done' && phase !== 'reset' && (
                <div className="absolute right-3 bottom-3 z-10">
                  <div
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px]"
                    style={{ background: c.bgCard, border: `1px solid ${c.border}` }}
                  >
                    <Settings className="h-[16px] w-[16px]" style={{ color: c.textSec }} />
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isModal(phase) && (
                <motion.div
                  key="ov"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-50"
                  style={{ background: c.overlay }}
                />
              )}
            </AnimatePresence>

            <div className="absolute inset-0 z-[60] flex items-center justify-center overflow-hidden p-4">
              <AnimatePresence mode="wait">
                {phase === 'manufacturer' && <ManufacturerModal key="mfg" clicking={clicking} />}
                {phase === 'board' && <BoardModal key="brd" clicking={clicking} />}
                {phase === 'os' && <OsModal key="os" clicking={clicking} />}
                {phase === 'storage' && <StorageModal key="stg" clicking={clicking} />}
                {phase === 'confirm' && <ConfirmModal key="cfm" clicking={clicking} />}
              </AnimatePresence>
            </div>
          </div>

          <style jsx global>{`
            .mockup-shimmer {
              background: linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.3) 50%,
                transparent 100%
              );
              background-size: 200% 100%;
              animation: mockup-shimmer-kf 2s infinite linear;
            }
            @keyframes mockup-shimmer-kf {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
            .mockup-indeterminate {
              animation: mockup-indet-kf 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }
            @keyframes mockup-indet-kf {
              0% {
                transform: translateX(-100%) scaleX(0.8);
              }
              50% {
                transform: translateX(250%) scaleX(1);
              }
              100% {
                transform: translateX(600%) scaleX(0.8);
              }
            }
            .mockup-scroll {
              overflow-y: auto;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .mockup-scroll::-webkit-scrollbar {
              display: none;
            }
            .mockup-marquee-container {
              display: inline-block;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              text-align: center;
            }
            .mockup-marquee-container.overflow {
              text-overflow: clip;
            }
            .mockup-marquee-container .mockup-marquee-content {
              display: inline-block;
            }
            .mockup-marquee-container.overflow .mockup-marquee-content {
              animation: mockup-marquee-kf 12s linear infinite;
            }
            @keyframes mockup-marquee-kf {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(var(--scroll-percent, -50%));
              }
            }
          `}</style>
        </div>
      </DataCtx.Provider>
    </ThemeCtx.Provider>
  );
}
