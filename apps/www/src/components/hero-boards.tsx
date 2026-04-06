'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Board {
  slug: string;
  name: string;
  image_url: string;
}

const CYCLE_MS = 5000;

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function HeroBoards({ boards }: { boards: Board[] }) {
  const [isMobile, setIsMobile] = useState(true); // default true = don't render on SSR
  const [group, setGroup] = useState(() => boards.slice(0, 3));
  const [fading, setFading] = useState(false);
  const currentSlugsRef = useRef(new Set<string>());

  // Only mount on desktop — saves images, GPU, and timers on mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Track current slugs
  useEffect(() => {
    currentSlugsRef.current = new Set(group.map((b) => b.slug));
  }, [group]);

  const cycleBoards = useCallback(() => {
    const available = boards.filter((b) => !currentSlugsRef.current.has(b.slug));
    const pool = available.length >= 3 ? available : boards;
    const next = shuffle(pool).slice(0, 3);

    // Fade out, swap, fade in
    setFading(true);
    setTimeout(() => {
      setGroup(next);
      setFading(false);
    }, 600);
  }, [boards]);

  useEffect(() => {
    if (isMobile || boards.length < 4) return;
    const interval = setInterval(cycleBoards, CYCLE_MS);
    return () => clearInterval(interval);
  }, [isMobile, boards, cycleBoards]);

  if (isMobile || group.length < 3) return null;

  return (
    <div
      className="relative h-[500px] lg:h-[600px] hidden md:block board-scene pointer-events-none"
      style={{
        transition: 'opacity 600ms ease',
        opacity: fading ? 0 : 1,
      }}
    >
      {/* Center board — main, large, slow float */}
      <div
        className="absolute inset-0 flex items-center justify-center z-30 animate-float-slow board-layer"
        style={{ transform: 'rotateX(10deg) rotateY(-15deg) scale(1.1)' }}
      >
        <div className="relative w-72 lg:w-96">
          <div className="absolute -inset-4 bg-[rgb(var(--brand)/0.15)] blur-3xl rounded-full" />
          <img
            src={group[0]!.image_url}
            alt={group[0]!.name}
            width={480}
            height={480}
            className="w-full relative z-10 drop-shadow-[0_40px_40px_rgba(0,0,0,0.8)]"
          />
        </div>
      </div>

      {/* Back left board — blurred, smaller, medium float */}
      <div
        className="absolute top-20 left-10 z-10 animate-float-medium board-layer opacity-40 blur-sm"
        style={{ transform: 'rotateX(20deg) rotateY(20deg) scale(0.7)' }}
      >
        <img
          src={group[1]!.image_url}
          alt={group[1]!.name}
          width={480}
          height={480}
          className="w-64 drop-shadow-2xl"
        />
      </div>

      {/* Bottom right board — slightly smaller, fast float */}
      <div
        className="absolute bottom-10 right-0 z-40 animate-float-fast board-layer opacity-90"
        style={{ transform: 'rotateX(-15deg) rotateY(-25deg) scale(0.9)' }}
      >
        <img
          src={group[2]!.image_url}
          alt={group[2]!.name}
          width={480}
          height={480}
          className="w-64 drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)]"
        />
      </div>
    </div>
  );
}
