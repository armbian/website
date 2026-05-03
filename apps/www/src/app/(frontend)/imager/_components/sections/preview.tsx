import { SectionHeading } from '../section-heading';
import { ScrollReveal } from '@/components/scroll-reveal';
import { AppMockup } from '../app-mockup';
import { SectionErrorBoundary } from '../section-error-boundary';

export function Preview() {
  return (
    <section
      id="preview"
      className="py-[var(--space-fluid-xl)] relative overflow-hidden border-y border-white/5 scroll-mt-16"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            label="Preview"
            title="See the workflow"
            subtitle="A guided 4-step process — select your manufacturer, board, OS image, and storage. Then flash with verification, all from a single screen."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.2} distance={50} className="hidden sm:block relative">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[110%] rounded-full bg-[rgb(var(--brand))] blur-[140px] opacity-25 pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute top-[20%] left-[10%] w-[40%] h-[60%] rounded-full bg-blue-600 blur-[120px] opacity-25 pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute bottom-[10%] right-[10%] w-[35%] h-[60%] rounded-full bg-purple-500 blur-[120px] opacity-20 pointer-events-none"
          />

          {/* Scaled wrapper: mockup is fixed at 1024px; height tracks scale. */}
          <div className="relative z-10 w-full overflow-hidden h-[400px] sm:h-[460px] md:h-[540px] lg:h-[640px] xl:h-[666px]">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[0.6] sm:scale-[0.69] md:scale-[0.81] lg:scale-[0.96] xl:scale-100 w-[1024px] max-w-none">
              <SectionErrorBoundary sectionName="App preview">
                <AppMockup />
              </SectionErrorBoundary>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
