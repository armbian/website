'use client';

import { Fragment } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import { HeroBoards } from '@/components/hero-boards';
import { ScrollReveal, CountUp } from '@/components/scroll-reveal';
import { heroContent } from '../../_content/hero';

interface Board {
  slug: string;
  name: string;
  image_url: string;
}

interface HeroProps {
  boards: Board[];
  stats: { boards: number; vendors: number };
}

export function Hero({ boards, stats }: HeroProps) {
  const statItems = [
    { value: stats.boards, suffix: '+', label: 'Boards' },
    { value: stats.vendors, suffix: '+', label: 'Vendors' },
    { value: 18, suffix: '', label: 'Languages' },
  ];

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-36 pb-[var(--space-fluid-lg)] scroll-mt-16"
    >
      <div className="hidden sm:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[rgb(var(--brand))] blur-[150px] opacity-20 pointer-events-none" />
      <div className="hidden sm:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[150px] opacity-10 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <ScrollReveal
            direction="left"
            duration={0.8}
            className="lg:col-span-6 text-center lg:text-left relative z-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[rgb(var(--brand)/0.3)] bg-[rgb(var(--brand)/0.1)] text-[rgb(var(--brand))] text-xs font-mono font-bold mb-6 uppercase tracking-widest backdrop-blur-sm shadow-[0_0_15px_rgb(var(--brand)/0.1)]">
              <Sparkles size={12} />
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--brand))] animate-pulse" />
              Open-source flashing tool
            </div>

            <h1 className="text-fluid-hero font-extrabold tracking-tighter leading-[1.05] mb-[var(--space-fluid-sm)] drop-shadow-2xl">
              {heroContent.title}
            </h1>

            <p className="text-fluid-lg text-[rgb(var(--fg-2))] font-medium leading-relaxed mb-[var(--space-fluid-md)] max-w-xl mx-auto lg:mx-0">
              {heroContent.subtitle}
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-[var(--space-fluid-md)]">
              <a
                href={heroContent.primaryCta.href}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-hover))] text-white font-bold text-sm shadow-[0_0_30px_rgb(var(--brand)/0.3)] transition-all hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                {heroContent.primaryCta.label}
              </a>
              <a
                href={heroContent.secondaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-[rgb(var(--bg-el))] border border-white/10 hover:border-white/30 hover:bg-[rgb(var(--bg-sub))] text-[rgb(var(--fg))] font-bold text-sm transition-all hover:-translate-y-0.5"
              >
                <Github className="h-4 w-4" />
                {heroContent.secondaryCta.label}
              </a>
            </div>

            <div className="inline-flex items-center gap-5 sm:gap-7 p-3 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
              {statItems.map((stat, i) => (
                <Fragment key={stat.label}>
                  <div className="text-left">
                    <span className="block font-black tracking-tight text-fluid-2xl tabular-nums">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </span>
                    <span className="text-[rgb(var(--fg-3))] uppercase tracking-widest text-[10px] font-bold mt-0.5 block">
                      {stat.label}
                    </span>
                  </div>
                  {i < statItems.length - 1 && <div className="w-px h-9 bg-white/10" />}
                </Fragment>
              ))}
            </div>
          </ScrollReveal>

          {boards.length >= 3 && (
            <ScrollReveal direction="right" delay={0.2} duration={0.8} className="lg:col-span-6">
              <HeroBoards boards={boards} />
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
