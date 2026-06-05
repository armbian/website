import { GitPullRequest, Bug, BookOpen, Cpu } from 'lucide-react';
import { ARMBIAN_URLS } from '@armbian/config';
import type { ContributeContent, ContributeWay } from './types';

export const contributeWays: ContributeWay[] = [
  { label: 'Submit a PR', icon: GitPullRequest },
  { label: 'Report a bug', icon: Bug },
  { label: 'Improve docs', icon: BookOpen },
  { label: 'Test on boards', icon: Cpu },
];

export const contributeContent: ContributeContent = {
  title: 'Contribute to Armbian Imager',
  description:
    'Armbian Imager is open source and community-driven. Every contribution matters, whether code, docs, or testing on new boards.',
  cta: {
    label: 'Start Contributing',
    href: ARMBIAN_URLS.IMAGER_CONTRIBUTING,
  },
};
