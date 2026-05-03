'use client';

import { Download } from 'lucide-react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import { Button } from '@/components/ui/button';
import { MotionWrapper } from '@/components/motion-wrapper';
import { SectionObserver } from '@/components/section-observer';
import { AppMockup } from '@/components/app-mockup';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { heroContent } from '@/content/hero';
import { scaleInVariants } from '@/lib/animation-variants';

export function Hero() {
  return (
    <SectionObserver
      sectionId="hero"
      className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <MotionWrapper>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {heroContent.title}
            </h1>
          </MotionWrapper>

          <MotionWrapper>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
              {heroContent.subtitle}
            </p>
          </MotionWrapper>

          <MotionWrapper>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <a href={heroContent.primaryCta.href}>
                  <Download className="h-4 w-4" />
                  {heroContent.primaryCta.label}
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={heroContent.secondaryCta.href} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  {heroContent.secondaryCta.label}
                </a>
              </Button>
            </div>
          </MotionWrapper>

          <MotionWrapper variants={scaleInVariants} className="mt-12 hidden lg:block">
            <SectionErrorBoundary sectionName="App preview">
              <AppMockup />
            </SectionErrorBoundary>
          </MotionWrapper>
        </div>
      </div>
    </SectionObserver>
  );
}
