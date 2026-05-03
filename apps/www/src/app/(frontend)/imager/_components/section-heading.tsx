import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ label, title, subtitle, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-16 flex flex-col items-center text-center', className)}>
      {label && (
        <span className="text-[rgb(var(--brand))] font-mono text-sm tracking-widest uppercase font-bold mb-4">
          {label}
        </span>
      )}
      <h2 className="text-fluid-3xl font-black tracking-tight mb-[var(--space-fluid-sm)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[rgb(var(--fg-2))] max-w-2xl text-lg font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
