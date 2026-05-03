import { SectionHeading } from '@/components/section-heading';
import { SectionObserver } from '@/components/section-observer';
import { MotionWrapper } from '@/components/motion-wrapper';
import { steps } from '@/content/steps';
import { staggerContainerVariants, fadeUpVariants } from '@/lib/animation-variants';

export function HowItWorks() {
  return (
    <SectionObserver sectionId="how-it-works" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MotionWrapper>
          <SectionHeading
            title="How It Works"
            subtitle="From install to a booting Armbian system in five steps."
          />
        </MotionWrapper>

        <MotionWrapper variants={staggerContainerVariants}>
          <div className="relative">
            {/* Horizontal connector line (desktop only) */}
            <div className="border-border absolute top-[38px] right-[10%] left-[10%] hidden border-t border-dashed lg:block" />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, i) => (
                <MotionWrapper key={step.title} variants={fadeUpVariants}>
                  <div className="group relative flex flex-col items-center text-center">
                    {/* Number + icon */}
                    <div className="relative mb-5">
                      <div className="bg-card border-border group-hover:border-primary-500/40 relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-2xl border-2 transition-colors">
                        <step.icon className="text-primary-500 h-7 w-7" />
                      </div>
                      <span className="bg-primary-500 absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>

                    {/* Text */}
                    <h3 className="mb-2 text-[15px] font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground text-[13px] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </MotionWrapper>
              ))}
            </div>
          </div>
        </MotionWrapper>
      </div>
    </SectionObserver>
  );
}
