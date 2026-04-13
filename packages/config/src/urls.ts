/** External data source URLs */
export const DATA_SOURCES = {
  IMAGES: 'https://github.armbian.com/armbian-images.json',
  PARTNERS: 'https://github.armbian.com/partners.json',
  MAINTAINERS: 'https://github.armbian.com/maintainers.json',
  KERNEL_DESCRIPTIONS: 'https://github.armbian.com/kernel-description.json',
} as const;

/** Default image sizes */
export const IMAGE_SIZES = {
  BOARD: '480',
  VENDOR: '480',
} as const;

/** Armbian external service URLs */
export const ARMBIAN_URLS = {
  DOCS: 'https://docs.armbian.com',
  FORUM: 'https://forum.armbian.com',
  GITHUB_ORG: 'https://github.com/armbian',
  WEBSITE: 'https://www.armbian.com',
  IMAGER: 'https://imager.armbian.com',
  BLOG: 'https://blog.armbian.com',
  BLOG_RSS: 'https://blog.armbian.com/rss/',
  CONTRIBUTE: 'https://docs.armbian.com/Process_Contribute/',
  DONATE: 'https://www.armbian.com/donate',
  GITHUB_SPONSORS: 'https://github.com/sponsors/armbian',
  BUILD_DOCS: 'https://docs.armbian.com/Developer-Guide_Build-Preparation/',
  DISCORD: 'https://discord.armbian.com',
  IRC: 'https://webchat.oftc.net/#armbian',
  PAYPAL: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=A2AM5NWLVENF2',
  LIBERAPAY: 'https://liberapay.com/armbian',
  SUBSCRIPTIONS: 'https://forum.armbian.com/subscriptions/',
  MERCH_EU: 'http://swag.armbian.com/',
  GITHUB_API_REPO: 'https://api.github.com/repos/armbian/build',
  CALENDLY_OFFICE_HOURS: 'https://calendly.com/armbian/office-hours',
  CALENDLY_CONSULTATION: 'https://calendly.com/armbian/consultation',
  BIGIN_FORM: 'https://bigin.zoho.eu/crm/WebForm',
  BIGIN_FORM_PAGE: 'https://eu.bigin.online/org20084575190/forms/contact-form',
  INFO_EMAIL: 'info@armbian.com',
  RECAPTCHA_SCRIPT: 'https://www.google.com/recaptcha/api.js',
  TWITTER: 'https://twitter.com/armbian',
  MASTODON: 'https://fosstodon.org/@armbian',
  LINKEDIN: 'https://www.linkedin.com/company/armbian',
} as const;

/**
 * Construct a board image URL.
 * Default: serves via the API image proxy (relative path, works with Next.js rewrite).
 * Pass `cdn: true` to use the CDN directly (e.g. for external consumers).
 */
export function boardImageUrl(
  slug: string,
  size: string = IMAGE_SIZES.BOARD,
  options?: { cdn?: boolean },
): string {
  if (options?.cdn) return `https://cache.armbian.com/images/${size}/${slug}.png`;
  return `/api/v1/images/boards/${size}/${slug}.png`;
}

/**
 * Construct a vendor logo URL.
 * Default: serves via the API image proxy (relative path, works with Next.js rewrite).
 * Pass `cdn: true` to use the CDN directly (e.g. for external consumers).
 */
export function vendorLogoUrl(
  vendor: string,
  size: string = IMAGE_SIZES.VENDOR,
  options?: { cdn?: boolean },
): string {
  if (options?.cdn) return `https://cache.armbian.com/images/vendors/${size}/${vendor}.png`;
  return `/api/v1/images/vendors/${size}/${vendor}.png`;
}

/** Construct a partner logo URL (served via API image cache) */
export function partnerLogoUrl(slug: string): string {
  return `/api/v1/images/partners/${slug}.png`;
}

/** Construct board GitHub config URL */
/** Map support tier to board config file extension */
const TIER_EXTENSION: Record<string, string> = {
  platinum: '.conf',
  standard: '.conf',
  community: '.csc',
  wip: '.wip',
  eos: '.eos',
  tvb: '.tvb',
};

export function boardGithubUrl(slug: string, supportTier?: string): string {
  const ext = TIER_EXTENSION[supportTier ?? ''] ?? '.conf';
  return `${ARMBIAN_URLS.GITHUB_ORG}/build/tree/main/config/boards/${slug}${ext}`;
}

/** Construct board documentation URL */
export function boardDocsUrl(slug: string): string {
  return `${ARMBIAN_URLS.DOCS}/board/${slug}/`;
}

/** Construct board forum URL */
export function boardForumUrl(slug: string): string {
  return `${ARMBIAN_URLS.FORUM}/search/?q=${encodeURIComponent(slug)}`;
}

/** Construct build command for a board */
export function buildCommand(slug: string): string {
  return `./compile.sh BOARD=${slug} RELEASE=trixie BUILD_DESKTOP=no BUILD_MINIMAL=yes KERNEL_CONFIGURE=no`;
}
