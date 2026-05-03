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
  selectedBg: string;
  clickBg: string;
  warningBg: string;
  warningBorder: string;
  deviceIconBg: string;
  deviceIconColor: string;
  inactiveTabBg: string;
  inactiveTabBorder: string;
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
export interface OsEntry {
  name: string;
  de: string;
  deKey: string;
  kernel: string;
  kernelKey: string;
  size: string;
  distro: 'ubuntu' | 'debian';
}
export interface ArmbianData {
  manufacturers: MfgInfo[];
  boardsByMfg: Record<string, BoardEntry[]>;
  imagesByBoard: Record<string, OsEntry[]>;
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
