/** Known vendor slug to clean display name mapping */
export const VENDOR_DISPLAY_NAMES: Record<string, string> = {
  'friendlyelec': 'FriendlyElec',
  'friendlyarm': 'FriendlyElec',
  'hardkernel': 'Hardkernel / Odroid',
  'xunlong': 'Orange Pi',
  'radxa': 'Radxa',
  'pine64': 'Pine64',
  'olimex': 'Olimex',
  'sinovoip': 'Banana Pi',
  'khadas': 'Khadas',
  'libre-computer': 'Libre Computer',
  'rockchip': 'Rockchip',
  'amlogic': 'Amlogic',
  'allwinner': 'Allwinner',
  'nvidia': 'NVIDIA',
  'asus': 'ASUS',
  'beagleboard': 'BeagleBoard',
  'inovato': 'Inovato',
  'bigtreetech': 'Bigtreetech',
  'bananapi': 'Banana Pi',
  'orangepi': 'Orange Pi',
  'cubieboard': 'Cubieboard',
  'cubietech': 'Cubieboard',
  'ugoos': 'Ugoos',
  'wetek': 'WeTek',
  'globalscale': 'Globalscale',
  'solidrun': 'SolidRun',
  'jethome': 'JetHome',
  'kobol': 'Kobol',
  'helios': 'Kobol',
  'raspberrypi': 'RPi Foundation',
  'arm': 'ARM',
  'texas-instruments': 'Texas Instruments',
  'rpi-foundation': 'Raspberry Pi',
  'intel': 'Intel / AMD',
  'spacemit': 'SpaceMit',
  'tq-group': 'TQ Group',
  'phytium': 'Phytium',
  'orangepi-rk': 'Orange Pi',
  'makerbase': 'Makerbase',
  'oneplus': 'OnePlus',
  'xiaomi': 'Xiaomi',
  'btt': 'BTT',
  'tqgroup': 'TQ Group',
  'cool-pi': 'Cool Pi',
  'star-five': 'StarFive',
  'mangopi': 'MangoPi',
  'ti': 'Texas Instruments',
  'armsom': 'ArmSoM',
  'luckfox': 'Luckfox',
  'mekotronics': 'Mekotronics',
  'minisforum': 'Minisforum',
};

/**
 * Clean up a raw vendor company name to a short, recognizable display name.
 * 1. Check the known mapping by slug
 * 2. Strip common corporate suffixes (Co., Ltd., Inc., etc.)
 * 3. Fallback to slug with capitalization
 */
export function cleanVendorName(slug: string, companyName?: string): string {
  // Normalize slug for lookup (handle variants)
  // Exact match on slug first
  const slugLower = slug.toLowerCase();
  if (VENDOR_DISPLAY_NAMES[slugLower]) {
    return VENDOR_DISPLAY_NAMES[slugLower];
  }
  // Then try exact match on normalized (no separators)
  const normalizedSlug = slugLower.replace(/[^a-z0-9]/g, '');
  for (const [key, display] of Object.entries(VENDOR_DISPLAY_NAMES)) {
    const normalizedKey = key.replace(/[^a-z0-9]/g, '');
    if (normalizedSlug === normalizedKey) {
      return display;
    }
  }

  if (!companyName || !companyName.trim()) {
    // Capitalize slug: "some-vendor" -> "Some Vendor"
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Strip corporate suffixes
  return companyName
    .replace(/\s*\(.*?\)\s*/g, '')                    // Remove parenthetical
    .replace(/,?\s*(Co\.|Corp|Inc|LLC|Ltd|Limited|GmbH|S\.?A\.?|Technology|Electronics?|Computer|Group|International)\.?\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim() || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
