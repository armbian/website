'use client';

import { useEffect, useRef } from 'react';
import { useActiveSection } from '@/providers/active-section-provider';

interface SectionObserverProps {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionObserver({ sectionId, children, className }: SectionObserverProps) {
  const ref = useRef<HTMLElement>(null);
  const { setActiveSection } = useActiveSection();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(sectionId);
        }
      },
      { rootMargin: '-40% 0px -60% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [sectionId, setActiveSection]);

  return (
    <section ref={ref} id={sectionId} className={className}>
      {children}
    </section>
  );
}
