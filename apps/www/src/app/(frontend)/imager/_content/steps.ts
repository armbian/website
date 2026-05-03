import { Download, Cpu, HardDrive, Database, Zap } from 'lucide-react';
import type { Step } from './types';

export const steps: Step[] = [
  {
    title: 'Install the app',
    description:
      'Download Armbian Imager for your platform and launch it. Available as .exe, .dmg, or AppImage.',
    icon: Download,
  },
  {
    title: 'Pick your board',
    description:
      'Select the manufacturer and board from a catalog of 300+ single-board computers with real photos.',
    icon: Cpu,
  },
  {
    title: 'Choose an image',
    description:
      'Browse compatible Armbian images filtered by desktop environment, kernel version, and stability tier.',
    icon: Database,
  },
  {
    title: 'Select storage',
    description:
      'Insert your SD card or USB drive — the app detects connected devices and warns before overwriting.',
    icon: HardDrive,
  },
  {
    title: 'Flash & verify',
    description:
      'One click to download, write, and verify. SHA checksums and post-write validation ensure a perfect flash.',
    icon: Zap,
  },
];
