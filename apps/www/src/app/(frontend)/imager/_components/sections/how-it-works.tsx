import { SectionHeading } from '../section-heading';
import { ScrollReveal } from '@/components/scroll-reveal';
import { steps } from '../../_content/steps';

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-[var(--space-fluid-xl)] relative border-y border-white/5 scroll-mt-16 overflow-hidden"
    >
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-[rgb(var(--brand))] blur-[140px] opacity-15 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            label="How it works"
            title="Five steps to a booting Armbian"
            subtitle="From install to a running system — no terminal required."
          />
        </ScrollReveal>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <ScrollReveal
              key={step.title}
              direction="up"
              delay={i * 0.1}
              distance={40}
              className="h-full"
            >
              <div className="bento-card rounded-2xl p-6 group relative overflow-hidden h-full flex flex-col">
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--brand)/0.1)] border border-[rgb(var(--brand)/0.2)] group-hover:bg-[rgb(var(--brand)/0.15)] transition-colors">
                    <step.icon className="h-5 w-5 text-[rgb(var(--brand))]" />
                  </div>
                  <span className="text-[rgb(var(--brand))] font-mono text-xs uppercase tracking-widest font-bold">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="relative z-10 text-base font-bold tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="relative z-10 text-[rgb(var(--fg-2))] text-[13px] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
