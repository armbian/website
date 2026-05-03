import { MessageCircle, Hash, Users, GitPullRequest, Bug, BookOpen, Cpu } from 'lucide-react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import type { CommunityLink, ContributeContent, ContributeWay } from './types';

export const communityLinks: CommunityLink[] = [
  {
    title: 'GitHub',
    description: 'Browse the source, track issues, and contribute code to Armbian Imager.',
    href: 'https://github.com/armbian/imager',
    icon: Github,
    tag: 'Source Code',
  },
  {
    title: 'Forum',
    description: 'Get help, share your builds, and connect with the Armbian community.',
    href: 'https://forum.armbian.com',
    icon: MessageCircle,
    tag: 'Support',
  },
  {
    title: 'Discord',
    description: 'Join real-time conversations with developers and makers.',
    href: 'https://discord.gg/armbian',
    icon: Hash,
    tag: 'Live Chat',
  },
  {
    title: 'Matrix',
    description: 'Decentralized, open-source chat bridged with the Discord server.',
    href: 'https://matrix.to/#/#armbian:matrix.org',
    icon: Users,
    tag: 'Open Protocol',
  },
];

export const contributeWays: ContributeWay[] = [
  { label: 'Submit a PR', icon: GitPullRequest },
  { label: 'Report a bug', icon: Bug },
  { label: 'Improve docs', icon: BookOpen },
  { label: 'Test on boards', icon: Cpu },
];

export const contributeContent: ContributeContent = {
  title: 'Contribute to Armbian Imager',
  description:
    'Armbian Imager is open source and community-driven. Every contribution matters — from code to docs to testing on new boards.',
  cta: {
    label: 'Start Contributing',
    href: 'https://github.com/armbian/imager/blob/main/CONTRIBUTING.md',
  },
};
