import type { Image, Stability, ImageFormat } from '@armbian/schemas';

export type TC = {
  bgApp: string;
  bgCard: string;
  bgSec: string;
  border: string;
  borderLight: string;
  text: string;
  textSec: string;
  textMuted: string;
  textDim: string;
  textDim2: string;
  overlay: string;
  shadow: string;
  shadowHeavy: string;
  titleBarBg: string;
  titleBarBorder: string;
  titleBarText: string;
  pillsBg: string;
  pillsBorder: string;
  pillStepBg: string;
  pillStepColor: string;
  logoFilter: string;
  /** Theme-appropriate wordmark asset so it stays legible on either background. */
  logo: string;
  selectedBg: string;
  clickBg: string;
  warningBg: string;
  warningBorder: string;
  deviceIconBg: string;
  deviceIconColor: string;
  inactiveTabBg: string;
  inactiveTabBorder: string;
  // Inline-panel tokens, mirror desktop theme.css.
  bgHover: string;
  success: string;
  info: string;
  warning: string;
  islandBg: string;
  islandBorder: string;
  cardHoverShadow: string;
  deviceAlertBg: string;
  deviceAlertBorder: string;
  deviceAlertIcon: string;
};

export interface MfgInfo {
  id: string;
  name: string;
  logo: string | null;
  boardCount: number;
}
export type DemoTier = 'platinum' | 'standard' | 'community';

export interface BoardEntry {
  slug: string;
  name: string;
  imageCount: number;
  tier: DemoTier;
}
/** Trimmed Image projection so the demo gallery only sees the fields it renders. */
export interface OsImage {
  fileUrl: string; // Image.download.file_url, used as React key
  variant: string; // Image.variant
  distribution: string; // Image.distribution (release codename)
  release: string; // Image.release (Armbian version)
  kernelBranch: string; // Image.kernel_branch
  kernelVersion: string; // Image.kernel_version
  application: string | null; // Image.application
  promoted: boolean; // Image.promoted
  stability: Stability; // Image.stability
  format: ImageFormat; // Image.format
  sizeBytes: number; // Image.download.size_bytes
  buildDate: string; // Image.download.updated_at (ISO), desktop's build_date analogue
}

/** Maps a real `@armbian/schemas` Image onto the demo's OsImage projection. */
export function toOsImage(img: Image): OsImage {
  return {
    fileUrl: img.download.file_url,
    variant: img.variant,
    distribution: img.distribution,
    release: img.release,
    kernelBranch: img.kernel_branch,
    kernelVersion: img.kernel_version,
    application: img.application,
    promoted: img.promoted,
    stability: img.stability,
    format: img.format,
    sizeBytes: img.download.size_bytes,
    buildDate: img.download.updated_at,
  };
}

export interface ArmbianData {
  manufacturers: MfgInfo[];
  boardsByMfg: Record<string, BoardEntry[]>;
  // Populated lazily per board; may be missing until that board's images are fetched.
  imagesByBoard: Record<string, OsImage[]>;
}
export type Selection = { mfgIdx: number; boardIdx: number; osIdx: number };
export type Phase =
  | 'home'
  | 'manufacturer'
  | 'board'
  | 'os'
  | 'storage'
  | 'confirm'
  | 'flashing'
  | 'done'
  | 'reset';
