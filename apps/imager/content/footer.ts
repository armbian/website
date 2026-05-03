import { MessageCircle } from 'lucide-react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import { DiscordIcon } from '@/components/icons/discord';
import type { FooterSection, SocialLink } from './types';

export const footerSections: FooterSection[] = [
  {
    title: 'Project',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Downloads', href: '#downloads' },

      { label: 'Release Notes', href: 'https://github.com/armbian/imager/releases' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: 'https://github.com/armbian/imager' },
      { label: 'Forum', href: 'https://forum.armbian.com' },
      { label: 'Discord', href: 'https://discord.gg/armbian' },
      { label: 'Matrix', href: 'https://matrix.to/#/#armbian:matrix.org' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: 'https://docs.armbian.com' },
      { label: 'Supported Boards', href: 'https://www.armbian.com/download/' },
      { label: 'Blog', href: 'https://blog.armbian.com' },
      { label: 'Donate', href: 'https://www.armbian.com/donate/' },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/armbian/imager', icon: Github },
  { label: 'Forum', href: 'https://forum.armbian.com', icon: MessageCircle },
  { label: 'Discord', href: 'https://discord.gg/armbian', icon: DiscordIcon },
];

export const footerLicense = 'Licensed under GPL-2.0';
export const footerCopyright = `© ${new Date().getFullYear()} Armbian. All rights reserved.`;
