import {
  Download,
  Check,
  HardDrive,
  ShieldCheck,
  Archive,
  Star,
  Shield,
  RefreshCw,
  AppWindow,
  Box,
  type LucideIcon,
} from 'lucide-react';
import { IMAGE_SIZES } from '@armbian/config';
import { API_BASE } from '../../_lib/api';
import type { CSSProperties } from 'react';
import type { OsImage, Phase } from './types';

export const BOARD_CDN = `${API_BASE}/api/v1/images/boards/${IMAGE_SIZES.BOARD}`;
export const FALLBACK_BOARD_IMG = '/imager/assets/armbian-logo_nofound.png';

export const STEPS = ['MANUFACTURER', 'BOARD', 'OS', 'STORAGE'] as const;
export const ACCENT_RGB = '242, 101, 34';
export const ACCENT = `rgb(${ACCENT_RGB})`;

/** Mirrors src/config/badges.ts DESKTOP_BADGES. */
export const DESKTOP_BADGES: Record<string, { label: string; color: string }> = {
  gnome: { label: 'GNOME', color: '#4a86cf' },
  kde: { label: 'KDE', color: '#1d99f3' },
  xfce: { label: 'XFCE', color: '#2284f2' },
  cinnamon: { label: 'Cinnamon', color: '#dc682e' },
  budgie: { label: 'Budgie', color: '#6a9fb5' },
  mate: { label: 'MATE', color: '#9bda5a' },
  lxde: { label: 'LXDE', color: '#a4a4a4' },
  lxqt: { label: 'LXQt', color: '#0192d3' },
  i3: { label: 'i3WM', color: '#1a8cff' },
  sway: { label: 'Sway', color: '#68b0d8' },
};

/** Mirrors src/config/badges.ts KERNEL_BADGES. */
export const KERNEL_BADGES: Record<string, { label: string; color: string }> = {
  current: { label: 'Current', color: '#10b981' },
  edge: { label: 'Edge', color: '#ef4444' },
  legacy: { label: 'Legacy', color: '#6b7280' },
  vendor: { label: 'Vendor', color: '#8b5cf6' },
  collabora: { label: 'Collabora', color: '#f59e0b' },
  sc8280xp: { label: 'SC8280XP', color: '#06b6d4' },
  cloud: { label: 'Cloud', color: '#0ea5e9' },
};

export const DESKTOP_ENVIRONMENTS = Object.keys(DESKTOP_BADGES);

export const tierStyle: Record<string, { bg: string; color: string }> = {
  platinum: { bg: 'linear-gradient(135deg,#fcd34d,#f59e0b)', color: '#1a1a1a' },
  standard: { bg: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' },
  community: { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff' },
};

/** Mirrors src/config/supportTiers.ts. */
export const SUPPORT_TIER_LABEL: Record<string, string> = {
  platinum: 'Platinum',
  standard: 'Standard',
  community: 'Community',
  eos: 'EOS',
  tvb: 'TV Box',
  wip: 'WIP',
};

export const isTrunkImage = (img: OsImage): boolean => img.release.toLowerCase().includes('trunk');

/** Mirrors src/config/imageFilters.ts IMAGE_FILTER_PREDICATES. */
export const IMAGE_FILTER_PREDICATES: Record<string, (img: OsImage) => boolean> = {
  recommended: (img) => img.promoted === true,
  // Exclude trunk so Stable and Rolling stay mutually exclusive.
  stable: (img) => img.stability === 'stable' && !isTrunkImage(img),
  rolling: isTrunkImage,
  apps: (img) => !!(img.application && img.application.length > 0),
  // Minimal: no desktop environment and no preinstalled app.
  barebone: (img) => {
    const variant = img.variant.toLowerCase();
    const hasDesktop = DESKTOP_ENVIRONMENTS.some((de) => variant.includes(de));
    const hasApp = !!(img.application && img.application.length > 0);
    return !hasDesktop && !hasApp;
  },
};

/** Mirrors src/config/imageFilters.ts FILTER_BUTTONS. */
export const FILTER_BUTTONS: Array<{ key: string; labelKey: string; icon: LucideIcon }> = [
  { key: 'recommended', labelKey: 'Recommended', icon: Star },
  { key: 'stable', labelKey: 'Stable', icon: Shield },
  { key: 'rolling', labelKey: 'Rolling Release', icon: RefreshCw },
  { key: 'apps', labelKey: 'Apps', icon: AppWindow },
  { key: 'barebone', labelKey: 'Minimal', icon: Box },
];

/** Toolbar filters minus the always-pinned "recommended" group. */
export const REST_FILTER_BUTTONS = FILTER_BUTTONS.filter((b) => b.key !== 'recommended');

/** Mirrors src/config/os-info.ts OS_INFO. */
export const OS_INFO: Record<string, { name: string }> = {
  bookworm: { name: 'Debian 12' },
  bullseye: { name: 'Debian 11' },
  trixie: { name: 'Debian 13' },
  forky: { name: 'Debian 14' },
  sid: { name: 'Debian Sid' },
  noble: { name: 'Ubuntu 24.04' },
  jammy: { name: 'Ubuntu 22.04' },
  resolute: { name: 'Ubuntu 26.04' },
  plucky: { name: 'Ubuntu 25.04' },
  oracular: { name: 'Ubuntu 24.10' },
  focal: { name: 'Ubuntu 20.04' },
  mantic: { name: 'Ubuntu 23.10' },
  lunar: { name: 'Ubuntu 23.04' },
};

/** Mirrors src/config/os-info.ts APP_INFO. */
export const APP_INFO: Record<string, { name: string; badge?: string; color: string }> = {
  homeassistant: { name: 'Home Assistant', color: '#18bcf2' },
  openmediavault: { name: 'OpenMediaVault', color: '#5dacdf' },
  omv: { name: 'OpenMediaVault', color: '#5dacdf' },
  sdk: { name: 'Code server + Armbian sources', badge: 'SDK', color: '#1e88e5' },
  openhab: { name: 'openHAB', color: '#e64a19' },
  kali: { name: 'Kali Linux', color: '#367bf0' },
};

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const full =
    c.length === 3
      ? c
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : c;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatBuildDate(images: OsImage[], locale?: string): string | undefined {
  const dates = images.map((img) => img.buildDate).filter((d): d is string => !!d);
  if (dates.length === 0) return undefined;
  // ISO 8601 strings sort lexicographically, so the max is the most recent build.
  const latest = dates.reduce((a, b) => (a > b ? a : b));
  const parsed = new Date(latest);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

export function getKernelType(branch: string): string | null {
  const b = branch.toLowerCase();
  for (const key of Object.keys(KERNEL_BADGES)) {
    if (b.includes(key)) return key;
  }
  return null;
}

export function getDesktopEnv(variant: string): string | null {
  const v = variant.toLowerCase();
  for (const key of DESKTOP_ENVIRONMENTS) {
    if (v.includes(key)) return key;
  }
  return null;
}

export function getOsInfo(release: string): { name: string } | undefined {
  const r = release.toLowerCase();
  for (const [key, info] of Object.entries(OS_INFO)) {
    if (r.includes(key)) return info;
  }
  return undefined;
}

export function getAppInfo(
  application: string | null,
): { name: string; badge?: string; color: string } | undefined {
  if (!application) return undefined;
  const a = application.toLowerCase();
  for (const [key, info] of Object.entries(APP_INFO)) {
    if (a.includes(key)) return info;
  }
  return undefined;
}

export function getImageVariantLabel(img: OsImage): string {
  const appInfo = getAppInfo(img.application);
  if (appInfo) return appInfo.badge ?? appInfo.name;

  const desktopEnv = getDesktopEnv(img.variant);
  if (desktopEnv && DESKTOP_BADGES[desktopEnv]) return DESKTOP_BADGES[desktopEnv].label;

  return 'Minimal';
}

/**
 * Mono mark URL for an image (app first, then distro); null when none exists.
 * Whitened in-card via `filter: brightness(0) invert(1)`: CSS mask-image is broken in WebKit.
 */
export function getMonoLogo(release: string, app?: string | null): string | null {
  const base = '/imager/assets/mono';
  if (app) {
    const a = app.toLowerCase();
    // The Armbian SDK ships code-server, so it uses the VS Code mark.
    if (a.includes('sdk')) return `${base}/vscode.svg`;
    if (a.includes('homeassistant')) return `${base}/homeassistant.svg`;
    if (a.includes('omv') || a.includes('openmediavault')) return `${base}/openmediavault.svg`;
    if (a.includes('kali')) return `${base}/kali.svg`;
    if (a.includes('openhab')) return `${base}/openhab.svg`;
  }

  const distro = release.toLowerCase();
  if (distro.includes('ubuntu')) return `${base}/ubuntu.svg`;
  if (distro.includes('debian')) return `${base}/debian.svg`;

  // Ubuntu/Debian codenames used by the Armbian API.
  if (/(noble|jammy|resolute|plucky|oracular|focal|mantic|lunar)/.test(distro)) {
    return `${base}/ubuntu.svg`;
  }
  if (/(bookworm|bullseye|trixie|forky|sid)/.test(distro)) return `${base}/debian.svg`;

  return null;
}

export type OsCategory = 'desktop' | 'minimal' | 'apps' | 'rolling';

/** Category precedence: trunk, app, desktop, else minimal. */
export function categoryOf(img: OsImage): OsCategory {
  if (isTrunkImage(img)) return 'rolling';
  if (img.application && img.application.length > 0) return 'apps';
  const variant = img.variant.toLowerCase();
  if (DESKTOP_ENVIRONMENTS.some((de) => variant.includes(de))) return 'desktop';
  return 'minimal';
}

export function statusOf(img: OsImage): { label: string; color: string } {
  if (isTrunkImage(img)) return { label: 'Rolling', color: '#3b82f6' };
  return { label: 'Stable', color: '#10b981' };
}

/** Strip the trailing "-trunk.NN" rolling suffix, keeping the 26.x.y number. */
export function versionLabel(img: OsImage): string {
  const raw = img.release || '';
  const dash = raw.indexOf('-');
  return dash === -1 ? raw : raw.slice(0, dash);
}

/** Mirrors desktop formatImageIdentity().title; used by flash badge, confirm summary, sidebar. */
export function formatOsIdentity(img: OsImage): string {
  return `Armbian ${versionLabel(img)} ${getImageVariantLabel(img)}`.replace(/\s+/g, ' ').trim();
}

export function distroGradient(osName: string): string {
  const n = osName.toLowerCase();
  if (n.includes('ubuntu')) return 'linear-gradient(160deg, #f97b4b 0%, #e95420 42%, #9b3a8d 100%)';
  if (n.includes('debian')) return 'linear-gradient(160deg, #d63060 0%, #a80030 42%, #8b2f6b 100%)';
  return 'linear-gradient(160deg, #f9853f 0%, #e9601f 45%, #b23b1f 100%)';
}

/** Two-stop distro gradient for the split card's side block (no purple tail). */
export function distroBlock(osName: string): string {
  const n = osName.toLowerCase();
  if (n.includes('ubuntu')) return 'linear-gradient(135deg, #f0703a 0%, #d4400f 100%)';
  if (n.includes('debian')) return 'linear-gradient(135deg, #c43a63 0%, #9b0a30 100%)';
  return 'linear-gradient(135deg, #ef7836 0%, #d8541b 100%)';
}

export function distroAccent(osName: string): string {
  const n = osName.toLowerCase();
  if (n.includes('ubuntu')) return '#e95420';
  if (n.includes('debian')) return '#d70a53';
  return '#e9601f';
}

export function distroVars(osName: string): CSSProperties {
  const hex = distroAccent(osName);
  return {
    '--distro': hex,
    '--distro-soft': hexToRgba(hex, 0.14),
    '--distro-ring': hexToRgba(hex, 0.42),
    '--distro-glow': hexToRgba(hex, 0.28),
  } as unknown as CSSProperties;
}

/** `indeterminate` toggles the breathing track instead of a determinate fill. */
export const FLASH_STAGES = [
  { key: 'downloading', label: 'Downloading image...', icon: Download, indeterminate: false },
  {
    key: 'verifying-sha',
    label: 'Verifying the download...',
    icon: ShieldCheck,
    indeterminate: true,
  },
  { key: 'decompressing', label: 'Decompressing image...', icon: Archive, indeterminate: true },
  { key: 'writing', label: 'Writing image to device...', icon: HardDrive, indeterminate: false },
  { key: 'verifying', label: 'Verifying the written data...', icon: Check, indeterminate: false },
] as const;

export const isModal = (p: Phase) =>
  p === 'manufacturer' || p === 'board' || p === 'os' || p === 'storage' || p === 'confirm';
