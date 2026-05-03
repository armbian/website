import { Navbar } from '@/sections/navbar';
import { Hero } from '@/sections/hero';
import { Features } from '@/sections/features';
import { HowItWorks } from '@/sections/how-it-works';

import { Downloads } from '@/sections/downloads';
import { Testimonials } from '@/sections/testimonials';
import { Community } from '@/sections/community';
import { Footer } from '@/sections/footer';
import { AmbientGlow } from '@/components/ambient-glow';
import { SectionErrorBoundary } from '@/components/section-error-boundary';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientGlow />

      <div className="relative z-10">
        <Navbar />
        <main id="main">
          <Hero />
          <Features />
          <HowItWorks />
          <SectionErrorBoundary sectionName="Downloads">
            <Downloads />
          </SectionErrorBoundary>
          <Testimonials />
          <Community />
        </main>
        <Footer />
      </div>
    </div>
  );
}
