import { ARMBIAN_URLS } from '@armbian/config';
import type { SiteMetadata } from './types';

export const siteMetadata: SiteMetadata = {
  title: 'Armbian Imager — Flash Armbian OS to SD & USB Drives',
  description:
    'Armbian Imager is a free, open-source tool to flash Armbian OS images to SD cards and USB drives. Supports Windows, macOS, and Linux with built-in integrity verification.',
  url: ARMBIAN_URLS.IMAGER,
};
