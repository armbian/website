'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { ARMBIAN_URLS } from '@armbian/config';
import { SectionHeading } from '../section-heading';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PLATFORMS,
  FALLBACK_ASSETS,
  INITIAL_VERSION,
  INITIAL_TAG,
  mapRelease,
} from '../../_content/downloads';
import { useImagerRepo } from '../../_hooks/use-imager-repo';

function detectOS(): string {
  if (typeof navigator === 'undefined') return 'linux';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  return 'linux';
}

export function Downloads() {
  const { data, loading, error: usingFallback } = useImagerRepo();
  const [userOS, setUserOS] = useState<string | null>(null);

  useEffect(() => {
    setUserOS(detectOS());
  }, []);

  const tagFromApi = data?.tag_name ?? null;
  const version = tagFromApi ? tagFromApi.replace(/^v/, '') : INITIAL_VERSION;
  const tag = tagFromApi ?? INITIAL_TAG;

  const assetMap = useMemo(
    () => (data?.assets && data.assets.length > 0 ? mapRelease(data.assets) : FALLBACK_ASSETS),
    [data?.assets],
  );

  const sorted = useMemo(
    () =>
      userOS
        ? [...PLATFORMS.filter((p) => p.id === userOS), ...PLATFORMS.filter((p) => p.id !== userOS)]
        : [...PLATFORMS],
    [userOS],
  );

  return (
    <section
      id="downloads"
      className="py-[var(--space-fluid-xl)] bg-[rgb(var(--bg-sub))] relative scroll-mt-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            label="Download"
            title="Get Armbian Imager"
            subtitle="Native builds for every platform: Intel and ARM, Windows, macOS, and Linux."
          />
        </ScrollReveal>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((platform, i) => {
            const isDetected = platform.id === userOS;
            const assets = (assetMap[platform.id] || []).filter((a) => a.href);

            return (
              <ScrollReveal
                key={platform.id}
                delay={i * 0.12}
                distance={40}
                direction="up"
                className="h-full"
              >
                <div
                  className={`${
                    isDetected ? 'feature-card-orange' : 'feature-card-dark'
                  } rounded-2xl p-7 relative group overflow-hidden h-full flex flex-col shadow-2xl`}
                >
                  {isDetected && (
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[rgb(var(--brand)/0.2)] blur-[80px] rounded-full pointer-events-none transition-transform group-hover:scale-150" />
                  )}

                  <div className="relative z-10 flex items-center justify-between mb-5">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                        isDetected
                          ? 'bg-[rgb(var(--brand)/0.15)] border border-[rgb(var(--brand)/0.3)] shadow-[0_0_20px_rgb(var(--brand)/0.3)]'
                          : 'bg-[rgb(var(--bg-el))] border border-white/10'
                      }`}
                    >
                      <platform.icon
                        className={`h-6 w-6 ${
                          isDetected ? 'text-[rgb(var(--brand))]' : 'text-[rgb(var(--fg-2))]'
                        }`}
                      />
                    </div>
                    {isDetected && (
                      <span className="px-3 py-1 bg-[rgb(var(--brand)/0.2)] text-[rgb(var(--brand))] text-xs font-bold uppercase tracking-widest rounded border border-[rgb(var(--brand)/0.3)]">
                        Detected
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 mb-5">
                    <h3 className="text-2xl font-black mb-1 tracking-tight">{platform.name}</h3>
                    <span className="text-xs text-[rgb(var(--fg-3))] font-mono uppercase tracking-widest">
                      {platform.format}
                    </span>
                  </div>

                  <div className="relative z-10 flex flex-col gap-2.5 mt-auto">
                    {loading ? (
                      <>
                        <Skeleton className="h-[48px] rounded-lg" />
                        <Skeleton className="h-[48px] rounded-lg" />
                      </>
                    ) : (
                      assets.map((asset) => (
                        <a
                          key={asset.label}
                          href={asset.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group/btn flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                            isDetected
                              ? 'bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-hover))] text-white shadow-[0_0_20px_rgb(var(--brand)/0.25)]'
                              : 'bg-[rgb(var(--bg-el))] border border-white/10 hover:border-[rgb(var(--brand)/0.4)] text-[rgb(var(--fg))]'
                          }`}
                        >
                          <Download className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{asset.label}</span>
                          <svg
                            className={`h-4 w-4 shrink-0 opacity-50 transition-all group-hover/btn:translate-x-0.5 group-hover/btn:opacity-100 ${
                              isDetected ? '' : 'text-[rgb(var(--brand))]'
                            }`}
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M3 8h10m0 0L9 4m4 4L9 12"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {usingFallback && (
          <p className="mt-6 text-center text-xs text-[rgb(var(--fg-3))] font-mono">
            Showing a cached version. Latest release info is unavailable right now.
          </p>
        )}

        <ScrollReveal delay={0.4}>
          <div className="mt-12 flex justify-center">
            <a
              href={`${ARMBIAN_URLS.IMAGER_GITHUB}/releases/tag/${tag}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgb(var(--bg-el))] px-5 py-2.5 text-sm transition-all hover:border-[rgb(var(--brand)/0.4)] hover:bg-[rgb(var(--bg))]"
            >
              <span className="rounded-full bg-[rgb(var(--brand)/0.15)] border border-[rgb(var(--brand)/0.3)] px-2.5 py-0.5 text-xs font-mono font-bold text-[rgb(var(--brand))]">
                v{version}
              </span>
              <span className="text-[rgb(var(--fg-2))] font-medium">View all releases</span>
              <ExternalLink className="h-3.5 w-3.5 text-[rgb(var(--fg-3))] group-hover:text-[rgb(var(--brand))] transition-colors" />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
