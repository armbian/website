import { SectionHeading } from '@/components/section-heading';
import { SectionObserver } from '@/components/section-observer';
import { MotionWrapper } from '@/components/motion-wrapper';
import { HoverCard } from '@/components/hover-card';
import { features } from '@/content/features';
import { staggerContainerVariants, fadeUpVariants } from '@/lib/animation-variants';

export function Features() {
  return (
    <SectionObserver sectionId="features" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MotionWrapper>
          <SectionHeading
            title="Built for Armbian"
            subtitle="Every feature designed around the single-board computer workflow — from board selection to verified flash."
          />
        </MotionWrapper>

        <MotionWrapper variants={staggerContainerVariants}>
          {/* Bento grid: 2 large on top, 4 small below */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => {
              const isLarge = i < 2;
              return (
                <MotionWrapper
                  key={feature.title}
                  variants={fadeUpVariants}
                  className={isLarge ? 'lg:col-span-2' : ''}
                >
                  <HoverCard>
                    <div className={`p-6 ${isLarge ? 'sm:p-8' : ''}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="bg-primary-500/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                          <feature.icon className="h-5 w-5 text-primary-500" />
                        </div>
                        <h3 className={`font-semibold ${isLarge ? 'text-lg' : 'text-base'}`}>
                          {feature.title}
                        </h3>
                      </div>
                      <p
                        className={`text-muted-foreground leading-relaxed ${isLarge ? 'text-sm' : 'text-[13px]'}`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </HoverCard>
                </MotionWrapper>
              );
            })}
          </div>
        </MotionWrapper>
      </div>
    </SectionObserver>
  );
}
