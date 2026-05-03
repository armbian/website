'use client';

import { cn } from '@/lib/utils';
import { useActiveSection } from '@/providers/active-section-provider';

interface ScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ScrollLink({ href, children, className, onClick }: ScrollLinkProps) {
  const { activeSection } = useActiveSection();
  const sectionId = href.replace('#', '');
  const isActive = activeSection === sectionId;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    onClick?.();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'text-muted-foreground hover:text-foreground text-sm font-medium transition-colors',
        isActive && 'text-primary',
        className,
      )}
    >
      {children}
    </a>
  );
}
