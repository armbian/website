export interface OsReleaseConfig {
  codename: string;
  name: string;
  family: 'debian' | 'ubuntu';
  version: string;
}

export const OS_RELEASES: Record<string, OsReleaseConfig> = {
  // Debian
  bullseye: { codename: 'bullseye', name: 'Debian 11', family: 'debian', version: '11' },
  bookworm: { codename: 'bookworm', name: 'Debian 12', family: 'debian', version: '12' },
  trixie: { codename: 'trixie', name: 'Debian 13', family: 'debian', version: '13' },
  forky: { codename: 'forky', name: 'Debian 14', family: 'debian', version: '14' },
  sid: { codename: 'sid', name: 'Debian Sid', family: 'debian', version: 'sid' },
  // Ubuntu
  focal: { codename: 'focal', name: 'Ubuntu 20.04', family: 'ubuntu', version: '20.04' },
  jammy: { codename: 'jammy', name: 'Ubuntu 22.04', family: 'ubuntu', version: '22.04' },
  noble: { codename: 'noble', name: 'Ubuntu 24.04', family: 'ubuntu', version: '24.04' },
  oracular: { codename: 'oracular', name: 'Ubuntu 24.10', family: 'ubuntu', version: '24.10' },
  plucky: { codename: 'plucky', name: 'Ubuntu 25.04', family: 'ubuntu', version: '25.04' },
};

export function getOsRelease(codename: string): OsReleaseConfig | undefined {
  return OS_RELEASES[codename.toLowerCase()];
}

export const DESKTOP_VARIANTS: Record<string, string> = {
  gnome: 'GNOME',
  xfce: 'XFCE',
  kde: 'KDE Plasma',
  'kde-neon': 'KDE Neon',
  cinnamon: 'Cinnamon',
  budgie: 'Budgie',
  mate: 'MATE',
  lxde: 'LXDE',
  lxqt: 'LXQt',
  i3: 'i3wm',
  sway: 'Sway',
  minimal: 'Minimal (CLI)',
  server: 'Server',
};

const VARIANT_SUFFIXES: Record<string, string> = {
  'backported-mesa': '(Backported Mesa)',
  ufs: '(UFS)',
};

export function getVariantLabel(variant: string): string {
  const { base } = parseVariant(variant);
  return base;
}

export function parseVariant(variant: string): { base: string; extension: string | null } {
  const key = variant.toLowerCase();
  if (DESKTOP_VARIANTS[key]) return { base: DESKTOP_VARIANTS[key], extension: null };

  for (const [suffix, label] of Object.entries(VARIANT_SUFFIXES)) {
    if (key.endsWith(`-${suffix}`)) {
      const baseKey = key.slice(0, -(suffix.length + 1));
      return { base: DESKTOP_VARIANTS[baseKey] ?? baseKey, extension: label };
    }
  }

  return { base: variant, extension: null };
}
