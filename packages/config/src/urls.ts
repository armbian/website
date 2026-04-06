/** External data source URLs */
export const DATA_SOURCES = {
  IMAGES: 'https://github.armbian.com/armbian-images.json',
  PARTNERS: 'https://github.armbian.com/partners.json',
  MAINTAINERS: 'https://github.armbian.com/maintainers.json',
  KERNEL_DESCRIPTIONS: 'https://github.armbian.com/kernel-description.json',
} as const;

/** CDN URLs for board/vendor assets */
export const ASSET_URLS = {
  BOARD_IMAGES_BASE: 'https://cache.armbian.com/images/',
  BOARD_IMAGE_SIZE: '480',
  VENDOR_LOGOS_BASE: 'https://cache.armbian.com/images/vendors/',
  VENDOR_LOGO_SIZE: '480',
} as const;

/** Armbian external service URLs */
export const ARMBIAN_URLS = {
  DOCS: 'https://docs.armbian.com',
  FORUM: 'https://forum.armbian.com',
  GITHUB_BUILD: 'https://github.com/armbian/build',
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
  AMAZON_WISHLIST: 'https://www.amazon.de/hz/wishlist/ls/38S6D8XLO48IO?ref_=wl_share',
  MERCH_EU: 'http://swag.armbian.com/',
  MERCH_US: 'https://armbian.myspreadshop.com/',
  GITHUB_API_REPO: 'https://api.github.com/repos/armbian/build',
  CALENDLY_OFFICE_HOURS: 'https://calendly.com/armbian/office-hours',
  CALENDLY_CONSULTATION: 'https://calendly.com/armbian/consultation',
  PARTNER_FORM: 'https://www.armbian.com/partner-contact-form/',
  MATRIX: 'https://forum.armbian.com/topic/40413-enter-the-matrix/',
  BIGIN_FORM: 'https://eu.bigin.online/org20084575190/forms/contact-form',
  PARTNER_EMAIL: 'partners@armbian.com',
  INFO_EMAIL: 'info@armbian.com',
  TWITTER: 'https://twitter.com/armbian',
  MASTODON: 'https://fosstodon.org/@armbian',
  LINKEDIN: 'https://www.linkedin.com/company/armbian',
} as const;

/**
 * Construct a board image URL.
 * When `apiBase` is provided, serves via the local image proxy instead of the CDN.
 */
export function boardImageUrl(slug: string, size: string = ASSET_URLS.BOARD_IMAGE_SIZE, apiBase?: string): string {
  if (apiBase) return `${apiBase.replace(/\/$/, '')}/api/v1/images/boards/${size}/${slug}.png`;
  return `${ASSET_URLS.BOARD_IMAGES_BASE}${size}/${slug}.png`;
}

/**
 * Construct a vendor logo URL.
 * When `apiBase` is provided, serves via the local image proxy instead of the CDN.
 */
export function vendorLogoUrl(vendor: string, size: string = ASSET_URLS.VENDOR_LOGO_SIZE, apiBase?: string): string {
  if (apiBase) return `${apiBase.replace(/\/$/, '')}/api/v1/images/vendors/${size}/${vendor}.png`;
  return `${ASSET_URLS.VENDOR_LOGOS_BASE}${size}/${vendor}.png`;
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
  return `${ARMBIAN_URLS.GITHUB_BUILD}/tree/main/config/boards/${slug}${ext}`;
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
