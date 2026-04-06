import brand from './brand.json' with { type: 'json' };

export type BrandConfig = typeof brand;

/** Convert hex color to space-separated RGB for Tailwind opacity support */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 0xff} ${(n >> 8) & 0xff} ${n & 0xff}`;
}

/** Brand colors as RGB triplets (for use in CSS variables with opacity) */
export const brandColorsRgb = {
  primary: hexToRgb(brand.colors.brand.primary),
  primaryHover: hexToRgb(brand.colors.brand.primaryHover),
  primaryLight: hexToRgb(brand.colors.brand.primaryLight),
  secondary: hexToRgb(brand.colors.brand.secondary),
  success: hexToRgb(brand.colors.semantic.success),
  warning: hexToRgb(brand.colors.semantic.warning),
  error: hexToRgb(brand.colors.semantic.error),
  info: hexToRgb(brand.colors.semantic.info),
} as const;

/** Light theme surface colors as RGB */
export const lightColorsRgb = {
  background: hexToRgb(brand.colors.light.background),
  surface: hexToRgb(brand.colors.light.surface),
  surfaceRaised: hexToRgb(brand.colors.light.surfaceRaised),
  border: hexToRgb(brand.colors.light.border),
  text: hexToRgb(brand.colors.light.text),
  textSecondary: hexToRgb(brand.colors.light.textSecondary),
  textMuted: hexToRgb(brand.colors.light.textMuted),
} as const;

/** Dark theme surface colors as RGB */
export const darkColorsRgb = {
  background: hexToRgb(brand.colors.dark.background),
  surface: hexToRgb(brand.colors.dark.surface),
  surfaceRaised: hexToRgb(brand.colors.dark.surfaceRaised),
  border: hexToRgb(brand.colors.dark.border),
  text: hexToRgb(brand.colors.dark.text),
  textSecondary: hexToRgb(brand.colors.dark.textSecondary),
  textMuted: hexToRgb(brand.colors.dark.textMuted),
} as const;

export { brand };
