import type { ReactNode } from 'react';

export function PageHero({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative pt-28 sm:pt-32 pb-16 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--brand)/0.08)] via-[rgb(var(--brand)/0.03)] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-[rgb(var(--brand)/0.08)] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--brand)/0.3)] to-transparent" />

      <div className="relative z-10">{children}</div>
    </section>
  );
}
