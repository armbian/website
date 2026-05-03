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

        <ScrollReveal delay={0.2} distance={50} className="relative">
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

          {/* Mockup is fixed at 1024px wide; --mockup-scale shrinks it to
              fit any viewport without horizontal overflow. */}
          <div
            className="relative z-10 w-full overflow-hidden"
            style={
              {
                '--mockup-scale': 'min(1, calc((100vw - 48px) / 1024px))',
                height: 'calc(var(--mockup-scale) * 666px)',
              } as React.CSSProperties
            }
          >
            <div
              className="absolute left-1/2 top-0 origin-top w-[1024px] max-w-none"
              style={{ transform: 'translateX(-50%) scale(var(--mockup-scale, 1))' }}
            >
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
