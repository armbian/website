'use client';

import { Star, ExternalLink, Quote } from 'lucide-react';
import { ARMBIAN_URLS } from '@armbian/config';
import { SectionHeading } from '../section-heading';
import { ScrollReveal, CountUp } from '@/components/scroll-reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { testimonials } from '../../_content/testimonials';
import { useImagerRepo } from '../../_hooks/use-imager-repo';

const FALLBACK_STARS = 148;

export function Testimonials() {
  const { data, loading } = useImagerRepo();
  const stars = data?.stargazers_count ?? FALLBACK_STARS;

  return (
    <section id="testimonials" className="py-[var(--space-fluid-xl)] relative scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            label="Reviews"
            title="What people say"
            subtitle="Loved by developers and makers across the open-source community."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="mb-12 flex justify-center">
            <a
              href={ARMBIAN_URLS.IMAGER_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgb(var(--bg-el))] px-5 py-2.5 text-sm transition-all hover:border-[rgb(var(--brand)/0.4)] hover:-translate-y-0.5"
            >
              <Star className="h-4 w-4 fill-current text-[rgb(var(--brand))]" />
              {loading ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                <span className="font-bold tabular-nums">
                  <CountUp value={stars} />
                </span>
              )}
              <span className="text-[rgb(var(--fg-2))] font-medium">stars on GitHub</span>
              <ExternalLink className="h-3.5 w-3.5 text-[rgb(var(--fg-3))] opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.author} delay={i * 0.08} distance={40} className="h-full">
              <a
                href={t.source}
                target="_blank"
                rel="noopener noreferrer"
                className="bento-card rounded-2xl p-7 group relative overflow-hidden h-full flex flex-col"
              >
                <Quote className="relative z-10 mb-4 h-7 w-7 text-[rgb(var(--brand)/0.3)] group-hover:text-[rgb(var(--brand)/0.6)] transition-colors" />

                <p className="relative z-10 mb-6 flex-1 text-[15px] leading-relaxed text-[rgb(var(--fg))] italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <p className="text-sm font-bold tracking-tight">{t.author}</p>
                    <p className="text-xs text-[rgb(var(--fg-3))] mt-0.5">{t.role}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ml-3 group-hover:bg-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand))] transition-all">
                    <ExternalLink className="h-3 w-3 text-[rgb(var(--fg-3))] group-hover:text-white transition-colors" />
                  </div>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
