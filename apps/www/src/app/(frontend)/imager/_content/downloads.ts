import { Monitor, Apple, Terminal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ARMBIAN_URLS } from '@armbian/config';

type PlatformId = 'windows' | 'macos' | 'linux';
type Asset = { label: string; href: string };

interface Platform {
  id: PlatformId;
  name: string;
  icon: LucideIcon;
  format: string;
}

const FALLBACK_VERSION = '1.2.8';
const FALLBACK_TAG = 'v1.2.8';
const RELEASE_BASE = ARMBIAN_URLS.IMAGER_RELEASES;

export const PLATFORMS: Platform[] = [
  { id: 'windows', name: 'Windows', icon: Monitor, format: '.exe installer' },
  { id: 'macos', name: 'macOS', icon: Apple, format: '.dmg disk image' },
  { id: 'linux', name: 'Linux', icon: Terminal, format: 'AppImage' },
];

export const FALLBACK_ASSETS: Record<PlatformId, Asset[]> = {
  windows: [
    {
      label: 'Intel / AMD (x64)',
      href: `${RELEASE_BASE}/${FALLBACK_TAG}/Armbian.Imager_${FALLBACK_VERSION}_x64-setup.exe`,
    },
    {
      label: 'ARM (arm64)',
      href: `${RELEASE_BASE}/${FALLBACK_TAG}/Armbian.Imager_${FALLBACK_VERSION}_arm64-setup.exe`,
    },
  ],
  macos: [
    {
      label: 'Apple Silicon (M1–M4)',
      href: `${RELEASE_BASE}/${FALLBACK_TAG}/Armbian.Imager_${FALLBACK_VERSION}_aarch64.dmg`,
    },
    {
      label: 'Intel (x64)',
      href: `${RELEASE_BASE}/${FALLBACK_TAG}/Armbian.Imager_${FALLBACK_VERSION}_x64.dmg`,
    },
  ],
  linux: [
    {
      label: 'Intel / AMD (x64)',
      href: `${RELEASE_BASE}/${FALLBACK_TAG}/Armbian.Imager_${FALLBACK_VERSION}_amd64.AppImage`,
    },
    {
      label: 'ARM (arm64)',
      href: `${RELEASE_BASE}/${FALLBACK_TAG}/Armbian.Imager_${FALLBACK_VERSION}_aarch64.AppImage`,
    },
  ],
};

export const INITIAL_VERSION = FALLBACK_VERSION;
export const INITIAL_TAG = FALLBACK_TAG;

export function mapRelease(
  assets: { name: string; browser_download_url: string }[],
): Record<PlatformId, Asset[]> {
  const find = (pattern: string) =>
    assets.find((a) => a.name.includes(pattern) && !a.name.endsWith('.sig'))
      ?.browser_download_url || '';
  return {
    windows: [
      { label: 'Intel / AMD (x64)', href: find('x64-setup.exe') },
      { label: 'ARM (arm64)', href: find('arm64-setup.exe') },
    ],
    macos: [
      { label: 'Apple Silicon (M1–M4)', href: find('aarch64.dmg') },
      { label: 'Intel (x64)', href: find('x64.dmg') },
    ],
    linux: [
      { label: 'Intel / AMD (x64)', href: find('amd64.AppImage') },
      { label: 'ARM (arm64)', href: find('aarch64.AppImage') },
    ],
  };
}
