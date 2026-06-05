'use client';

import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/components/layout/theme-provider';

import { ThemeCtx, darkT, lightT } from './theme';
import { DataCtx, processApiData, makeSelection, fetchBoardImages, selMfg, selBoard } from './data';
import { ACCENT_RGB, BOARD_CDN, FLASH_STAGES, isModal } from './constants';
import { apiClient } from '../../_lib/api';
import { Header } from './header';
import { HomeSplit } from './home-split';
import { FlashScreen } from './flash-screen';
import type { ArmbianData, Selection, Phase, OsImage } from './types';

const PRELOAD_BOARDS = 6;

/** Static warm-aurora mesh behind the window content; mirrors desktop .app::before. */
const AMBIENT_MESH =
  `linear-gradient(180deg, rgba(${ACCENT_RGB},0.1), transparent 26%),` +
  `radial-gradient(40% 38% at 14% 16%, rgba(${ACCENT_RGB},0.26), transparent 64%),` +
  `radial-gradient(34% 32% at 88% 12%, rgba(255,178,66,0.17), transparent 64%),` +
  `radial-gradient(40% 40% at 92% 96%, rgba(${ACCENT_RGB},0.14), transparent 60%),` +
  `radial-gradient(34% 34% at 4% 98%, rgba(228,66,96,0.11), transparent 60%)`;

/** Phase to inline-panel step index; `confirm` keeps the storage step (3) active, shown full-bleed. */
const PHASE_TO_STEP: Partial<Record<Phase, number>> = {
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
  // OS images for the selected board are fetched lazily; gates the OsGallery skeleton.
  const [osLoading, setOsLoading] = useState(false);
  // Auto-play runs only while the mockup is on screen: scrolling away rewinds it to the
  // start (timers gated on inView), so it replays from the beginning when it returns to view.
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    let alive = true;
    apiClient
      // Fetch the full board set (API total ~338) so per-vendor counts match the app;
      // limit:200 truncated globally and under-counted vendors (e.g. FriendlyElec showed 19, not 38).
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
  }, []);

  const mfgIdx = selection?.mfgIdx;
  const preloadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!apiData || !selection) return;
    const mfg = selMfg(apiData, selection);
    const boards = (apiData.boardsByMfg[mfg.id] || []).slice(0, PRELOAD_BOARDS);
    const urls: string[] = [];
    if (mfg.logo) urls.push(mfg.logo);
    for (const b of boards) urls.push(`${BOARD_CDN}/${b.slug}.png`);
    urls.forEach((url) => {
      if (preloadedRef.current.has(url)) return;
      preloadedRef.current.add(url);
      const img = new window.Image();
      img.src = url;
    });
  }, [apiData, mfgIdx]);

  // Lazily fetch the selected board's OS images, then correct osIdx to the first
  // promoted image (else 0). Runs whenever the selected board changes; the OS step
  // shows the skeleton until the images land.
  const boardSlug = apiData && selection ? selBoard(apiData, selection).slug : undefined;
  useEffect(() => {
    if (!apiData || !selection || !boardSlug) return;
    if (apiData.imagesByBoard[boardSlug]) return; // already cached for this board

    let alive = true;
    setOsLoading(true);
    fetchBoardImages(boardSlug)
      .then((images) => {
        if (!alive) return;
        setApiData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            imagesByBoard: { ...prev.imagesByBoard, [boardSlug]: images },
          };
        });
        const promotedIdx = images.findIndex((i: OsImage) => i.promoted);
        const osIdx = promotedIdx >= 0 ? promotedIdx : 0;
        setSelection((prev) => (prev ? { ...prev, osIdx } : prev));
        setOsLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        // Empty image set: gallery renders its empty state; clear the skeleton.
        setApiData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            imagesByBoard: { ...prev.imagesByBoard, [boardSlug]: [] },
          };
        });
        setOsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [apiData, selection, boardSlug]);

  const completed = Array.from({ length: Math.min(step, 4) }, (_, i) => i);
  // Active inline panel: the panel phase's step, or the in-progress step on `home`.
  const activeStep = phase === 'home' ? step : (PHASE_TO_STEP[phase] ?? step);

  const advance = useCallback(() => {
    setClicking(false);
    if (phase === 'home') {
      const panelForStep: Phase[] = ['manufacturer', 'board', 'os', 'storage'];
      setPhase(panelForStep[step] || 'manufacturer');
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
      // Commit the device now (step 4) so the confirm view collapses the sidebar.
      setStep(4);
      setPhase('confirm');
    } else if (phase === 'confirm') {
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

  // Rewind the whole flow to its opening state (home, fresh random selection).
  const resetToStart = useCallback(() => {
    setClicking(false);
    setProgress(0);
    setFlashStage(0);
    setStep(0);
    setPhase('home');
    if (apiData) setSelection((prev) => makeSelection(apiData, prev));
  }, [apiData]);

  // Play while on screen, rewind to the start once scrolled away. The timers below
  // gate on inView, so they stay idle until the mockup returns to the viewport.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setInView(visible);
        if (!visible) resetToStart();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReducedMotion, apiData, resetToStart]);

  useEffect(() => {
    if (!apiData || !selection) return;
    if (!inView) return;
    const viewMs: Record<Phase, number> = {
      home: step === 0 ? 1500 : 900,
      manufacturer: 1800,
      board: 2200,
      // Richer gallery, so linger a touch longer once populated.
      os: 2600,
      storage: 1800,
      confirm: 1800,
      flashing: 13100,
      done: 2000,
      reset: 400,
    };
    // Defer the OS advance until images have loaded so the gallery is seen populated.
    // The effect re-runs when osLoading flips false (it is a dependency), scheduling
    // the real advance then.
    if (phase === 'os' && osLoading) return;
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
  }, [phase, step, advance, apiData, selection, osLoading, inView]);

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
        elapsed += stageMs[i - 1]!;
        timers.push(setTimeout(() => setFlashStage(i), elapsed));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'flashing') return;
    const stage = FLASH_STAGES[flashStage];
    if (!stage) return;
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

  if (fetchError) {
    return (
      <p className="py-8 text-center text-sm text-[rgb(var(--fg-3))]">
        Unable to load the app preview right now.
      </p>
    );
  }

  if (!apiData || !selection) return null;

  const isFlashing = phase === 'flashing' || phase === 'done';
  // The 'home' resting state renders the same inline panel as its panel phase, so only let
  // the card pulse during the real panel phase - otherwise it flashes twice (once idle, once selecting).
  const panelClicking = clicking && isModal(phase);

  return (
    <ThemeCtx.Provider value={c}>
      <DataCtx.Provider value={{ data: apiData, sel: selection }}>
        <div
          ref={rootRef}
          className="mockup-root relative isolate mx-auto flex aspect-[11/7] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl text-left shadow-2xl pointer-events-none select-none"
          style={{ background: c.bgApp }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-0"
            style={{ inset: '-8% -12%', background: AMBIENT_MESH, filter: 'blur(40px)' }}
          />

          {/* Overlay titlebar dots, positioned to mirror the app's window chrome. */}
          <div className="relative z-[1] flex shrink-0 items-center gap-[8px] px-5 pt-[16px] pb-[6px]">
            <span
              className="block h-[13px] w-[13px] rounded-full"
              style={{ background: '#ff5f57' }}
            />
            <span
              className="block h-[13px] w-[13px] rounded-full"
              style={{ background: '#febc2e' }}
            />
            <span
              className="block h-[13px] w-[13px] rounded-full"
              style={{ background: '#28c840' }}
            />
          </div>

          {/* Header + body fill the rest of the 1100×700 (11:7) window. */}
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
            <Header completed={completed} isFlashing={isFlashing} />

            <div className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait">
                {isFlashing ? (
                  <motion.div
                    key="flash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center px-6"
                  >
                    <FlashScreen
                      phase={phase}
                      flashStage={flashStage}
                      progress={progress}
                      clicking={clicking}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <HomeSplit
                      activeStep={activeStep}
                      step={step}
                      completed={completed}
                      clicking={panelClicking}
                      osLoading={osLoading}
                    />
                  </motion.div>
                )}
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
              /* Left-align so the scroll loop starts at the text's beginning, not mid-word. */
              text-align: left;
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
                /* Exact px shift (single text + separator) for a seamless loop; falls back to -50%. */
                transform: translateX(var(--marquee-shift, -50%));
              }
            }

            /* Staggered card entrance for the mfr/board/os grids (mfrCardIn).
               Used as a class (flow-panels) and as an animation name (os-gallery). */
            .mockup-card-in {
              animation: mockup-card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
            }
            @keyframes mockup-card-in {
              from {
                opacity: 0;
                transform: translateY(18px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: none;
              }
            }

            /* Floating board photo for the confirm + flash heroes (confirmFloat). */
            @keyframes mockup-confirm-float {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-12px);
              }
            }

            /* Breathing accent halo behind the board (confirmGlow). */
            @keyframes mockup-confirm-glow {
              0%,
              100% {
                opacity: 0.75;
                transform: scale(0.96);
              }
              50% {
                opacity: 1;
                transform: scale(1.06);
              }
            }

            /* Confirm/flash content rise + fade (confirmContentIn). */
            @keyframes mockup-content-in {
              from {
                opacity: 0;
                transform: translateY(16px);
              }
              to {
                opacity: 1;
                transform: none;
              }
            }

            /* Indeterminate flash-track sweep, 32% sliver (flashTrackSlide). */
            @keyframes mockup-track-slide {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(420%);
              }
            }

            /* Done-check spring (flashCheckPop). */
            @keyframes mockup-check-pop {
              0% {
                transform: scale(0.4);
                opacity: 0;
              }
              55% {
                transform: scale(1.18);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }

            /* Active stage-icon breathing (pulse). */
            @keyframes mockup-pulse {
              0%,
              100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }

            /* Panel/sidebar mount (splitIn). Used as a class in home-split. */
            .mockup-split-in {
              animation: mockup-split-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            @keyframes mockup-split-in {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: none;
              }
            }

            /* Used both as a class (SideStep) and as a bare animation name (header chips). */
            .mockup-ui-up {
              animation: mockup-ui-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
            }
            @keyframes mockup-ui-up {
              from {
                opacity: 0;
                transform: translateY(14px);
              }
              to {
                opacity: 1;
                transform: none;
              }
            }

            /* Reduced-motion users see a static frame: render the mockup but drop
               every entrance/loop animation and transition inside it. */
            @media (prefers-reduced-motion: reduce) {
              .mockup-root,
              .mockup-root * {
                animation-duration: 0.001ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.001ms !important;
              }
            }
          `}</style>
        </div>
      </DataCtx.Provider>
    </ThemeCtx.Provider>
  );
}
