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
      'Browse desktop, minimal/IoT, dedicated-application, and rolling-release images, filtered by kernel version and stability. Or point the app at your own local image.',
    icon: Database,
  },
  {
    title: 'Select storage',
    description:
      'Insert your SD card, USB drive, or NVMe. The app lists targets and hides system drives by default, then warns before overwriting.',
    icon: HardDrive,
  },
  {
    title: 'Flash & verify',
    description:
      'One click to download, write, and verify. SHA checksums and post-write validation confirm a clean flash, and any first-boot profile is applied automatically.',
    icon: Zap,
  },
];
