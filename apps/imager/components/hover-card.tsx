import { cn } from '@/lib/utils';

interface HoverCardBaseProps {
  className?: string;
  children: React.ReactNode;
}

interface HoverCardDivProps extends HoverCardBaseProps {
  as?: 'div';
  href?: never;
}

interface HoverCardAnchorProps extends HoverCardBaseProps {
  as: 'a';
  href: string;
}

type HoverCardProps = HoverCardDivProps | HoverCardAnchorProps;

const sharedClassName =
  'group border-border hover:border-primary-500/30 relative block h-full overflow-hidden rounded-2xl border bg-gradient-to-b from-transparent to-transparent transition-all hover:to-primary-500/[0.03]';

function AccentLine() {
  return (
    <div className="bg-primary-500 absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100" />
  );
}

export function HoverCard({ as, href, className, children }: HoverCardProps) {
  if (as === 'a') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(sharedClassName, className)}
      >
        <AccentLine />
        {children}
      </a>
    );
  }

  return (
    <div className={cn(sharedClassName, className)}>
      <AccentLine />
      {children}
    </div>
  );
}
