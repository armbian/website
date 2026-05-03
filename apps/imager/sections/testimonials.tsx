'use client';

import { Star, ExternalLink, Quote } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { SectionObserver } from '@/components/section-observer';
import { MotionWrapper } from '@/components/motion-wrapper';
import { HoverCard } from '@/components/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { testimonials } from '@/content/testimonials';
import { useImagerRepo } from '@/hooks/use-imager-repo';
import { staggerContainerVariants, fadeUpVariants } from '@/lib/animation-variants';

const FALLBACK_STARS = 148;

export function Testimonials() {
  const { data, loading } = useImagerRepo();
  const stars = data?.stargazers_count ?? FALLBACK_STARS;

  return (
    <SectionObserver sectionId="testimonials" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MotionWrapper>
          <SectionHeading
            title="What People Say"
            subtitle="Loved by developers, makers, and the open-source community."
          />
        </MotionWrapper>

        {/* GitHub stars badge */}
        <MotionWrapper>
          <div className="mb-10 flex justify-center">
            <a
              href="https://github.com/armbian/imager"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:border-primary-500/30 group inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm transition-all"
            >
              <Star className="text-primary-500 h-4 w-4 fill-current" />
              {loading ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <span className="font-semibold">{stars.toLocaleString()}</span>
              )}
              <span className="text-muted-foreground">stars on GitHub</span>
              <ExternalLink className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
            </a>
          </div>
        </MotionWrapper>

        {/* Testimonials grid */}
        <MotionWrapper variants={staggerContainerVariants}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <MotionWrapper key={t.author} variants={fadeUpVariants}>
                <HoverCard as="a" href={t.source}>
                  <div className="flex h-full flex-col p-6">
                    {/* Quote icon */}
                    <Quote className="text-primary-500/20 mb-3 h-6 w-6" />

                    {/* Quote text */}
                    <p className="mb-5 flex-1 text-sm leading-relaxed italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{t.author}</p>
                        <p className="text-muted-foreground text-xs">{t.role}</p>
                      </div>
                      <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" />
                    </div>
                  </div>
                </HoverCard>
              </MotionWrapper>
            ))}
          </div>
        </MotionWrapper>
      </div>
    </SectionObserver>
  );
}
