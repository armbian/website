import {
  LayoutGrid,
  ShieldCheck,
  Languages,
  HardDrive,
  RefreshCw,
  MonitorSmartphone,
  Check,
  ArrowRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { SectionHeading } from '../section-heading';
import { ScrollReveal } from '@/components/scroll-reveal';

interface FeatureCardProps {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  visual: ReactNode;
}

function BoardsVisual({ vendors, totalVendors }: { vendors: string[]; totalVendors: number }) {
  const remaining = Math.max(0, totalVendors - vendors.length);
  return (
    <div className="flex flex-wrap gap-2">
      {vendors.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[rgb(var(--bg-el))] px-2.5 py-1 text-[11px] font-medium text-[rgb(var(--fg-2))]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand))]" />
          {v}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-md bg-[rgb(var(--brand)/0.1)] border border-[rgb(var(--brand)/0.25)] px-2.5 py-1 text-[11px] font-mono font-bold text-[rgb(var(--brand))]">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

function VerifyVisual() {
  return (
    <div className="bg-black/60 dark:bg-black/60 bg-[rgb(20_20_24)] p-3.5 rounded-lg border border-white/10 font-mono text-[11px] leading-[1.7] overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
        <div className="w-2 h-2 rounded-full bg-red-500/50" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
        <div className="w-2 h-2 rounded-full bg-green-500/50" />
        <span className="text-gray-500 ml-2 text-[9px]">verifying image</span>
      </div>
      <div className="text-gray-400">
        <span className="text-emerald-400">$</span> sha256sum -c image.sha
      </div>
      <div className="text-emerald-400 mt-0.5 flex items-center gap-1">
        <Check className="h-3 w-3" /> Armbian_25.5_rockpi-s.img.xz:{' '}
        <span className="font-bold">OK</span>
      </div>
    </div>
  );
}

function LanguagesVisual() {
  const langs = ['EN', 'DE', 'IT', 'FR', 'ES', 'JA', 'ZH', 'PT', 'RU', 'KR', 'NL', '+7'];
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {langs.map((l) => (
        <span
          key={l}
          className={`inline-flex items-center justify-center rounded border border-white/10 bg-[rgb(var(--bg-el))] py-1 text-[10px] font-mono font-bold tracking-wider ${
            l === 'EN'
              ? 'text-[rgb(var(--brand))] border-[rgb(var(--brand)/0.3)] bg-[rgb(var(--brand)/0.1)]'
              : 'text-[rgb(var(--fg-2))]'
          }`}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

function CacheVisual() {
  return (
    <div className="rounded-lg border border-white/10 bg-[rgb(var(--bg-el))] p-3">
      <div className="flex items-center justify-between mb-2 text-[11px]">
        <span className="font-mono uppercase tracking-widest font-bold text-[rgb(var(--fg-3))]">
          Local cache
        </span>
        <span className="font-mono font-bold tabular-nums">
          <span className="text-[rgb(var(--brand))]">35</span>
          <span className="text-[rgb(var(--fg-3))]"> / 100 GB</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[rgb(var(--bg-sub))] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--brand))] to-[rgb(var(--brand-hover))] shadow-[0_0_10px_rgb(var(--brand)/0.4)]"
          style={{ width: '35%' }}
        />
      </div>
    </div>
  );
}

function UpdatesVisual() {
  return (
    <div className="rounded-lg border border-white/10 bg-[rgb(var(--bg-el))] p-3 flex items-center gap-3">
      <div className="flex-1 flex items-center gap-2 text-[12px] font-mono">
        <span className="text-[rgb(var(--fg-3))] tabular-nums">v1.2.8</span>
        <ArrowRight className="h-3 w-3 text-[rgb(var(--fg-3))]" />
        <span className="text-[rgb(var(--brand))] font-bold tabular-nums">v1.3.0</span>
      </div>
      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
        Available
      </span>
    </div>
  );
}

function PlatformsVisual() {
  const platforms = [
    { os: 'Windows', archs: 'x64 · ARM64' },
    { os: 'macOS', archs: 'Intel · Apple Silicon' },
    { os: 'Linux', archs: 'x64 · ARM64' },
  ];
  return (
    <div className="space-y-1.5">
      {platforms.map((p) => (
        <div
          key={p.os}
          className="flex items-center justify-between rounded-md border border-white/10 bg-[rgb(var(--bg-el))] px-3 py-1.5"
        >
          <span className="text-[12px] font-bold">{p.os}</span>
          <span className="text-[10px] font-mono text-[rgb(var(--fg-3))] uppercase tracking-widest">
            {p.archs}
          </span>
        </div>
      ))}
    </div>
  );
}

function getFeatures(
  vendors: string[],
  totalVendors: number,
  totalBoards: number,
): FeatureCardProps[] {
  return [
    {
      label: '01 — Catalog',
      title: `${totalBoards}+ Boards Supported`,
      description: `Browse ${totalVendors}+ manufacturers and ${totalBoards}+ single-board computers with real photos, support tiers, and curated image recommendations.`,
      icon: LayoutGrid,
      visual: <BoardsVisual vendors={vendors} totalVendors={totalVendors} />,
    },
    {
      label: '02 — Integrity',
      title: 'Download & Verify',
      description:
        'Images are downloaded, decompressed, and SHA-verified automatically. Post-write verification ensures every byte on your device is correct.',
      icon: ShieldCheck,
      visual: <VerifyVisual />,
    },
    {
      label: '03 — Localized',
      title: '18 Languages',
      description:
        'Fully localized in 18 languages with automatic system language detection — German, French, Japanese, Chinese and more.',
      icon: Languages,
      visual: <LanguagesVisual />,
    },
    {
      label: '04 — Storage',
      title: 'Smart Image Caching',
      description:
        'Downloaded images are cached locally (5–100 GB configurable) so re-flashing the same image to multiple devices is instant.',
      icon: HardDrive,
      visual: <CacheVisual />,
    },
    {
      label: '05 — Always Current',
      title: 'Auto Updates',
      description:
        'Built-in update checker notifies you of new releases with changelog preview and one-click install — always stay current.',
      icon: RefreshCw,
      visual: <UpdatesVisual />,
    },
    {
      label: '06 — Native',
      title: 'Cross-Platform',
      description:
        'Native builds for every desktop OS on both Intel and ARM architectures. Consistent experience everywhere.',
      icon: MonitorSmartphone,
      visual: <PlatformsVisual />,
    },
  ];
}

interface FeaturesProps {
  vendors: string[];
  totalVendors: number;
  totalBoards: number;
}

export function Features({ vendors, totalVendors, totalBoards }: FeaturesProps) {
  const features = getFeatures(vendors, totalVendors, totalBoards);
  return (
    <section
      id="features"
      className="py-[var(--space-fluid-xl)] bg-[rgb(var(--bg-sub))] relative scroll-mt-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            label="Features"
            title="Built for Armbian"
            subtitle="Every feature designed around the single-board computer workflow — from board selection to verified flash."
          />
        </ScrollReveal>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.08} distance={40} className="h-full">
              <div className="bento-card rounded-2xl p-7 group relative overflow-hidden h-full flex flex-col">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--brand)/0.25)] to-[rgb(var(--brand)/0.05)] border border-[rgb(var(--brand)/0.25)] shadow-[0_0_20px_rgb(var(--brand)/0.1)] group-hover:shadow-[0_0_30px_rgb(var(--brand)/0.25)] transition-shadow">
                      <feature.icon className="h-5 w-5 text-[rgb(var(--brand))]" />
                    </div>
                    <span className="text-[rgb(var(--brand))] font-mono text-[10px] tracking-widest uppercase font-bold">
                      {feature.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{feature.title}</h3>
                  <p className="text-[rgb(var(--fg-2))] text-[13px] leading-relaxed mb-5">
                    {feature.description}
                  </p>
                </div>
                <div className="relative z-10 mt-auto pt-2">{feature.visual}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
