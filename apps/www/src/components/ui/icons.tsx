import type { SVGProps } from 'react';
import {
  Code,
  Search,
  ChevronDown,
  ArrowRight,
  Download,
  ExternalLink,
} from 'lucide-react';
import { SiGithub } from '@icons-pack/react-simple-icons';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

type LucideIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </Icon>
  );
}

export function IconStorage(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="20" height="7" rx="1" />
      <rect x="2" y="14" width="20" height="7" rx="1" />
      <circle cx="6" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconDesktop(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  );
}

export function IconNetwork(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </Icon>
  );
}

export function IconCode({ size = 24, className, ...props }: LucideIconProps) {
  return <Code size={size} className={className} strokeWidth={1.5} {...props} />;
}

export function IconPrinter(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </Icon>
  );
}

export function IconForum(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </Icon>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </Icon>
  );
}

export function IconGitHub({ size = 24, className }: LucideIconProps) {
  return <SiGithub size={size} className={className} />;
}

export function IconSearch({ size = 24, className, ...props }: LucideIconProps) {
  return <Search size={size} className={className} strokeWidth={1.5} {...props} />;
}

export function IconChevronDown({ size = 24, className, ...props }: LucideIconProps) {
  return <ChevronDown size={size} className={className} strokeWidth={1.5} {...props} />;
}

export function IconArrowRight({ size = 24, className, ...props }: LucideIconProps) {
  return <ArrowRight size={size} className={className} strokeWidth={1.5} {...props} />;
}

export function IconTerminal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 17l6-5-6-5M12 19h8" />
    </Icon>
  );
}

export function IconDownload({ size = 24, className, ...props }: LucideIconProps) {
  return <Download size={size} className={className} strokeWidth={1.5} {...props} />;
}

export function IconCpu(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </Icon>
  );
}

export function IconExternalLink({ size = 24, className, ...props }: LucideIconProps) {
  return <ExternalLink size={size} className={className} strokeWidth={1.5} {...props} />;
}

export function IconDocker({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.186.186 0 00-.187.186v1.887c0 .102.084.185.187.185zm-2.954-5.43h2.118a.186.186 0 00.187-.185V3.577a.186.186 0 00-.187-.186h-2.118a.186.186 0 00-.187.186v1.886c0 .102.084.185.187.185zm0 2.716h2.118a.187.187 0 00.187-.186V6.292a.187.187 0 00-.187-.186h-2.118a.187.187 0 00-.187.186v1.886c0 .103.084.186.187.186zm-2.93 0h2.12a.186.186 0 00.186-.186V6.292a.187.187 0 00-.187-.186h-2.12a.187.187 0 00-.186.186v1.886c0 .103.083.186.186.186zm-2.964 0h2.119a.186.186 0 00.187-.186V6.292a.187.187 0 00-.187-.186H5.135a.186.186 0 00-.186.186v1.886c0 .103.083.186.186.186zm5.893 2.715h2.118a.186.186 0 00.187-.185V9.006a.186.186 0 00-.187-.186h-2.118a.187.187 0 00-.187.186v1.887c0 .102.084.185.187.185zm-2.93 0h2.12a.186.186 0 00.186-.185V9.006a.186.186 0 00-.187-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.083.185.186.185zm-2.964 0h2.119a.186.186 0 00.187-.185V9.006a.187.187 0 00-.187-.186H5.135a.186.186 0 00-.186.186v1.887c0 .102.083.185.186.185zm-2.92 0h2.12a.186.186 0 00.186-.185V9.006a.186.186 0 00-.187-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.083.185.186.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.29.44-.502.923-.627 1.43-.278 1.081-.107 2.1.489 2.967a4.524 4.524 0 01-1.682.381H.99a.986.986 0 00-.987.987c-.029 1.828.202 3.648.687 5.408.56 1.84 1.388 3.218 2.461 4.095 1.216.993 3.211 1.562 5.519 1.562a17.77 17.77 0 003.882-.436 11.727 11.727 0 003.34-1.487 11.14 11.14 0 002.534-2.37 14.437 14.437 0 002.093-3.696h.186c1.154 0 1.862-.467 2.254-.86.267-.26.467-.573.585-.92l.076-.241-.15-.113z"/>
    </svg>
  );
}

export function IconRepeat(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </Icon>
  );
}
