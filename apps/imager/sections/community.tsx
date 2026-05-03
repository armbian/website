import { ExternalLink, ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { SectionObserver } from '@/components/section-observer';
import { MotionWrapper } from '@/components/motion-wrapper';
import { HoverCard } from '@/components/hover-card';
import { communityLinks, contributeContent, contributeWays } from '@/content/community';
import { staggerContainerVariants, fadeUpVariants } from '@/lib/animation-variants';

export function Community() {
  return (
    <SectionObserver sectionId="community" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MotionWrapper>
          <SectionHeading
            title="Join the Community"
            subtitle="Connect with thousands of developers, makers, and Armbian enthusiasts worldwide."
          />
        </MotionWrapper>

        <MotionWrapper variants={staggerContainerVariants}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {communityLinks.map((link) => (
              <MotionWrapper key={link.title} variants={fadeUpVariants}>
                <HoverCard as="a" href={link.href}>
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="bg-primary-500/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <link.icon className="h-5 w-5 text-primary-500" />
                      </div>
                      <ExternalLink className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" />
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-base font-semibold">{link.title}</h3>
                      {link.tag && (
                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                          {link.tag}
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground text-[13px] leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                </HoverCard>
              </MotionWrapper>
            ))}
          </div>
        </MotionWrapper>

        {/* Contribute banner */}
        <MotionWrapper>
          <div className="border-border hover:border-primary-500/20 mt-8 overflow-hidden rounded-2xl border transition-colors">
            <div className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:p-10">
              {/* Left: text */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="mb-2 text-lg font-semibold">{contributeContent.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {contributeContent.description}
                </p>

                {/* Contribution types */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {contributeWays.map((way) => (
                    <span
                      key={way.label}
                      className="border-border bg-muted/50 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                    >
                      <way.icon className="text-primary-500 h-3 w-3" />
                      {way.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: CTA */}
              <a
                href={contributeContent.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-primary-500 hover:bg-primary-600 inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors"
              >
                {contributeContent.cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </MotionWrapper>
      </div>
    </SectionObserver>
  );
}
