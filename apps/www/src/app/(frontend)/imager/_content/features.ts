import {
  LayoutGrid,
  ShieldCheck,
  Languages,
  HardDrive,
  RefreshCw,
  MonitorSmartphone,
} from 'lucide-react';
import type { Feature } from './types';

export const features: Feature[] = [
  {
    title: '300+ Boards Supported',
    description:
      'Browse 70+ manufacturers and 300+ single-board computers with real photos, support tiers, and curated image recommendations.',
    icon: LayoutGrid,
  },
  {
    title: 'Download & Verify',
    description:
      'Images are downloaded, decompressed, and SHA-verified automatically. Post-write verification ensures every byte on your device is correct.',
    icon: ShieldCheck,
  },
  {
    title: '18 Languages',
    description:
      'Fully localized in 18 languages including German, French, Japanese, Chinese, and more — with automatic system language detection.',
    icon: Languages,
  },
  {
    title: 'Smart Image Caching',
    description:
      'Downloaded images are cached locally (5–100 GB configurable) so re-flashing the same image to multiple devices is instant.',
    icon: HardDrive,
  },
  {
    title: 'Auto Updates',
    description:
      'Built-in update checker notifies you of new releases with changelog preview and one-click install — always stay current.',
    icon: RefreshCw,
  },
  {
    title: 'Cross-Platform',
    description:
      'Native builds for Windows, macOS, and Linux on both Intel and ARM architectures. Consistent experience everywhere.',
    icon: MonitorSmartphone,
  },
];
