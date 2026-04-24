import { createHash } from 'node:crypto';
import type {
  BoardDetail,
  Image,
  ImageFormat,
  StorageVariant,
  CompanionFile,
  CompanionType,
  DisplayVariant,
  Vendor,
  Partner,
  Maintainer,
  RawImageAsset,
  RawPartner,
  RawMaintainer,
  RawKernelDescription,
  LegacyRedirectEntry,
  BoardEnrichment,
  SupportTier,
  KernelBranchInfo,
  BoardMaintainer,
} from '@armbian/schemas';
import {
  computeSupportTier,
  boardGithubUrl,
  boardDocsUrl,
  boardForumUrl,
  buildCommand,
  cleanVendorName,
  boardImageUrl,
  vendorLogoUrl,
  partnerLogoUrl,
} from '@armbian/config';
import type { NormalizedData } from './datastore.js';

interface RawSyncData {
  images: RawImageAsset[];
  partners: RawPartner[];
  maintainers: RawMaintainer[];
  kernelDescriptions: RawKernelDescription;
}

interface EnrichmentData {
  redirects: LegacyRedirectEntry[];
  enrichments: BoardEnrichment[];
  boardConfigSlugs?: Set<string>;
}

/**
 * Whitelist of upstream `file_extension` values mapped to the canonical
 * image format we expose on the site. Anything not in this map is skipped
 * and tracked so the operator can extend the list when upstream introduces
 * a new format.
 */
const VALID_IMAGE_EXTENSIONS: Record<string, ImageFormat> = {
  'img.xz': 'sd',
  'oowow.img.xz': 'sd',
  'rootfs.img.xz': 'sd',
  'ufs.img.xz': 'sd',
  'recovery.img.xz': 'sd',
  'kebab.img.xz': 'sd',
  'boe.img.xz': 'sd',
  'csot.img.xz': 'sd',
  xz: 'rootfs',
  'tar.xz': 'rootfs',
  'ufs.xz': 'rootfs',
  'img.qcow2': 'qemu',
  'img.qcow2.xz': 'qemu',
  'hyperv.zip': 'hyperv',
  'hyperv.zip.xz': 'hyperv',
};

/**
 * Board slugs whose `.tar.xz` archives are Qualcomm Deep Download (QDL)
 * payloads rather than conventional rootfs tarballs. This is a temporary
 * override until upstream starts emitting a dedicated format marker for
 * them; remove entries here once the JSON exposes the distinction natively.
 */
const QDL_BOARD_SLUGS = new Set<string>(['arduino-uno-q']);

/**
 * Companion file patterns. Each entry knows how to detect a companion file
 * by filename suffix and how to label it for the UI.
 */
const COMPANION_PATTERNS: { regex: RegExp; type: CompanionType; label: string }[] = [
  { regex: /\.fip\.img\.xz$/i, type: 'fip', label: 'ARM Trusted Firmware (FIP)' },
  { regex: /\.lk\.bin\.xz$/i, type: 'bootloader', label: 'Little Kernel bootloader' },
  { regex: /\.boot_recovery\.img\.xz$/i, type: 'recovery', label: 'Recovery partition' },
];

/**
 * Display variant pattern: matches device-specific boot partition images
 * such as `boot_sm8250-xiaomi-elish-boe.img.xz`. The trailing token is the
 * display panel identifier we expose to the user (BOE, CSOT, …).
 */
const DISPLAY_VARIANT_REGEX = /\.boot_[a-z0-9]+(?:-[a-z0-9]+)*-([a-z0-9]+)\.img\.xz$/i;
const ANY_BOOT_PARTITION_REGEX = /\.boot_[^.]+\.img\.xz$/i;

type AssetClassification =
  | {
      kind: 'primary';
      format: ImageFormat;
      storage: StorageVariant | null;
      cleanVariant: string;
      baseName: string;
    }
  | { kind: 'companion'; companionType: CompanionType; label: string; baseName: string }
  | { kind: 'display-variant'; display: string; baseName: string }
  | { kind: 'unknown' };

/** Strip a `-ufs` suffix off the upstream variant string. */
function extractStorageVariant(variant: string): {
  variant: string;
  storage: StorageVariant | null;
} {
  const m = variant.match(/^(.*)-ufs$/i);
  if (m) return { variant: m[1]!, storage: 'ufs' };
  return { variant, storage: null };
}

/**
 * Application tokens that upstream `file_application` is supposed to carry,
 * used to recover the field from the filename when upstream leaves it empty.
 * Upstream's parser misses app tokens that sit after an `-rcN` kernel RC
 * suffix (radxa-nio-12l collabora) or before a `.burn.img.xz` flash target
 * (jethubj* current); the 4 tokens below match the set actually emitted.
 */
const KNOWN_APPLICATIONS = ['kali', 'omv', 'homeassistant', 'openhab'] as const;
const APPLICATION_FROM_FILENAME_REGEX = new RegExp(
  `-(${KNOWN_APPLICATIONS.join('|')})(?=[._]|$)`,
  'i',
);

function detectApplicationFromFilename(filename: string): string | null {
  const m = filename.match(APPLICATION_FROM_FILENAME_REGEX);
  return m ? m[1]!.toLowerCase() : null;
}

/** Strip a known primary suffix to obtain the shared base filename. */
function extractPrimaryBaseName(filename: string): string {
  const suffixes = [
    /\.oowow\.img\.xz$/i,
    /\.rootfs\.img\.xz$/i,
    /\.ufs\.img\.xz$/i,
    /\.kebab\.img\.xz$/i,
    /\.boe\.img\.xz$/i,
    /\.csot\.img\.xz$/i,
    /\.recovery\.img\.xz$/i,
    /\.img\.qcow2\.xz$/i,
    /\.img\.qcow2$/i,
    /\.hyperv\.zip\.xz$/i,
    /\.hyperv\.zip$/i,
    /\.img\.xz$/i,
    /\.tar\.xz$/i,
    /\.ufs\.xz$/i,
    /\.xz$/i,
  ];
  for (const re of suffixes) {
    if (re.test(filename)) return filename.replace(re, '');
  }
  return filename;
}

function classifyAsset(asset: RawImageAsset): AssetClassification {
  const filename = (asset.file_url.split('/').pop() ?? '').toLowerCase();

  // Companion files are matched first because their suffix is more specific
  // than the bare `.img.xz` extension.
  for (const pat of COMPANION_PATTERNS) {
    if (pat.regex.test(filename)) {
      return {
        kind: 'companion',
        companionType: pat.type,
        label: pat.label,
        baseName: filename.replace(pat.regex, ''),
      };
    }
  }

  // Device-specific boot partitions become display variants. Each board with
  // multiple panels surfaces them as a radio selector in the UI.
  const displayMatch = filename.match(DISPLAY_VARIANT_REGEX);
  if (displayMatch) {
    return {
      kind: 'display-variant',
      display: displayMatch[1]!.toUpperCase(),
      baseName: filename.replace(ANY_BOOT_PARTITION_REGEX, ''),
    };
  }

  // The remaining files are primaries. They must pass the format whitelist.
  let format = VALID_IMAGE_EXTENSIONS[asset.file_extension];
  if (!format) return { kind: 'unknown' };

  // QDL override: a handful of Qualcomm-based boards ship `.tar.xz` archives
  // that are really QDL payloads, not rootfs tarballs. Upgrade the format so
  // the UI can label them correctly.
  if (format === 'rootfs' && QDL_BOARD_SLUGS.has(asset.board_slug)) {
    format = 'qdl';
  }

  const { variant: cleanVariant, storage } = extractStorageVariant(asset.variant);
  return {
    kind: 'primary',
    format,
    storage,
    cleanVariant,
    baseName: extractPrimaryBaseName(filename),
  };
}

export class Normalizer {
  constructor() {}

  normalize(raw: RawSyncData, enrichment: EnrichmentData): NormalizedData {
    const enrichmentMap = new Map(enrichment.enrichments.map((e) => [e.slug, e]));
    const maintainerMap = this.buildMaintainerBoardMap(raw.maintainers);
    const partnerMap = this.buildPartnerMap(raw.partners);

    // Tracker for unknown extensions encountered during this run; surfaced
    // at the end of normalize() so operators learn about new upstream formats.
    const unknownExtensions = new Set<string>();

    // Pass 1 — classify every upstream asset once. Primaries become flashable
    // images, companions get attached to their primary by matching baseName,
    // display variants become selectable boot partitions on the primary image.
    type ClassifiedAsset = { asset: RawImageAsset; classification: AssetClassification };
    const classified: ClassifiedAsset[] = [];
    for (const asset of raw.images) {
      const classification = classifyAsset(asset);
      if (classification.kind === 'unknown') {
        unknownExtensions.add(asset.file_extension);
        continue;
      }
      classified.push({ asset, classification });
    }

    // 1. Extract unique boards — primary assets only so `image_count` reflects
    // the flashable images the user actually sees, not companion firmware.
    const boardMap = new Map<
      string,
      {
        asset: RawImageAsset;
        images: RawImageAsset[];
        platinum: boolean;
      }
    >();

    for (const { asset, classification } of classified) {
      if (classification.kind !== 'primary') continue;

      const existing = boardMap.get(asset.board_slug);
      if (existing) {
        existing.images.push(asset);
        if (asset.platinum === 'true') existing.platinum = true;
      } else {
        boardMap.set(asset.board_slug, {
          asset,
          images: [asset],
          platinum: asset.platinum === 'true',
        });
      }
    }

    // 2. Build normalized boards
    const boards: BoardDetail[] = [];
    for (const [slug, entry] of boardMap) {
      const { asset, images: boardImages, platinum } = entry;
      const enrich = enrichmentMap.get(slug);

      const supportTier: SupportTier = computeSupportTier(
        asset.board_support,
        platinum ? 'true' : 'false',
      );

      const hasDesktop = boardImages.some((img) => img.variant !== 'minimal' && img.variant !== '');

      const promoted = boardImages.some((img) => img.promoted === 'true');

      const boardMaintainers = maintainerMap.get(slug) ?? [];

      const kernelBranches = this.extractKernelBranches(boardImages, raw.kernelDescriptions);

      boards.push({
        slug,
        name: asset.board_name,
        vendor_slug: asset.board_vendor,
        vendor_name: cleanVendorName(asset.board_vendor, asset.company_name),
        support_tier: supportTier,
        image_count: boardImages.length,
        has_desktop: hasDesktop,
        promoted,
        image_url: boardImageUrl(slug),
        soc: enrich?.soc ?? null,
        architecture: enrich?.architecture ?? this.detectArchitecture(slug, boardImages) ?? null,
        summary: enrich?.summary ?? null,
        features: enrich?.features ?? [],
        docs_url: boardDocsUrl(slug),
        forum_url: boardForumUrl(slug),
        github_url:
          !enrichment.boardConfigSlugs?.size || enrichment.boardConfigSlugs.has(slug)
            ? boardGithubUrl(slug, supportTier)
            : null,
        build_command: buildCommand(slug),
        legacy_paths: this.getLegacyPaths(slug, enrichment.redirects),
        maintainers: boardMaintainers,
        kernel_branches: kernelBranches,
      });
    }

    // 3. Build normalized images — one entry per primary asset, keyed by the
    // primary's baseName so companions / display variants can be attached to
    // the same flashable image in the follow-up passes.
    const primaryByBaseName = new Map<string, { image: Image; boardSlug: string }>();

    for (const { asset, classification } of classified) {
      if (classification.kind !== 'primary') continue;

      // UFS is a storage-hardware dimension, not an application overlay.
      // Upstream occasionally tags these images with application='ufs';
      // promote to storage='ufs' so the UI treats them uniformly with
      // other storage/format variants (QEMU, rootfs, QDL).
      const filename = (asset.file_url.split('/').pop() ?? '').toLowerCase();
      const rawApplication =
        asset.file_application || detectApplicationFromFilename(filename) || null;
      const isUfsApp = rawApplication === 'ufs';

      const key = `${asset.board_slug}::${classification.baseName}`;
      const image: Image = {
        id: hashString(asset.file_url),
        board_slug: asset.board_slug,
        variant: classification.cleanVariant || asset.variant,
        distribution: asset.distro,
        release: asset.armbian_version,
        kernel_branch: asset.branch,
        kernel_version: asset.kernel_version,
        application: isUfsApp ? null : rawApplication,
        promoted: asset.promoted === 'true',
        stability: asset.branch === 'edge' ? 'edge' : 'stable',
        format: classification.format,
        storage: classification.storage ?? (isUfsApp ? 'ufs' : null),
        companions: [],
        display_variants: [],
        download: {
          file_url: asset.redi_url || asset.file_url,
          direct_url: asset.file_url,
          sha_url: asset.redi_url_sha || asset.file_url_sha || null,
          asc_url: asset.redi_url_asc || asset.file_url_asc || null,
          torrent_url: asset.redi_url_torrent || asset.file_url_torrent || null,
          size_bytes: parseInt(asset.file_size, 10) || 0,
          updated_at: asset.file_date || new Date().toISOString(),
        },
      };
      primaryByBaseName.set(key, { image, boardSlug: asset.board_slug });
    }

    // Attach companions to every primary that shares their baseName. A single
    // FIP file may be reused across multiple kernel branches / distros for the
    // same board, so we broadcast it to all matching primaries. We prefer the
    // short `redi_url` redirect over the raw archive path so the user hits the
    // same canonical URL pattern as the main download button.
    for (const { asset, classification } of classified) {
      if (classification.kind !== 'companion') continue;

      const companion: CompanionFile = {
        type: classification.companionType,
        label: classification.label,
        url: asset.redi_url || asset.file_url,
        size_bytes: parseInt(asset.file_size, 10) || 0,
      };

      for (const entry of primaryByBaseName.values()) {
        if (entry.boardSlug !== asset.board_slug) continue;
        const entryBase = extractPrimaryBaseName(
          (entry.image.download.direct_url.split('/').pop() ?? '').toLowerCase(),
        );
        if (entryBase === classification.baseName) {
          entry.image.companions.push(companion);
        }
      }
    }

    // Attach display variants the same way.
    for (const { asset, classification } of classified) {
      if (classification.kind !== 'display-variant') continue;

      const variant: DisplayVariant = {
        label: classification.display,
        url: asset.redi_url || asset.file_url,
        size_bytes: parseInt(asset.file_size, 10) || 0,
      };

      for (const entry of primaryByBaseName.values()) {
        if (entry.boardSlug !== asset.board_slug) continue;
        const entryBase = extractPrimaryBaseName(
          (entry.image.download.direct_url.split('/').pop() ?? '').toLowerCase(),
        );
        if (entryBase === classification.baseName) {
          entry.image.display_variants.push(variant);
        }
      }
    }

    const normalizedImages: Image[] = [...primaryByBaseName.values()].map((e) => e.image);

    if (unknownExtensions.size > 0) {
      console.warn(
        '[normalizer] Unknown file_extension values skipped:',
        [...unknownExtensions].sort().join(', '),
        '— add them to VALID_IMAGE_EXTENSIONS if they should be supported.',
      );
    }

    // 4. Build normalized vendors — deduplicate by clean display name
    const vendorByName = new Map<string, Vendor>();
    const slugToDisplayName = new Map<string, string>();

    for (const board of boards) {
      const displayName = board.vendor_name;
      slugToDisplayName.set(board.vendor_slug, displayName);

      const existing = vendorByName.get(displayName);
      if (existing) {
        existing.board_count++;
      } else {
        const partnerTier = partnerMap.get(board.vendor_slug) ?? null;
        const rawAsset = boardMap.get(board.slug)?.asset;

        vendorByName.set(displayName, {
          slug: board.vendor_slug,
          name: displayName,
          logo_url: vendorLogoUrl(board.vendor_slug),
          website: rawAsset?.company_website || null,
          description: null,
          board_count: 1,
          partner_tier: partnerTier,
        });
      }
    }

    // Remap board vendor_slugs so boards with same display name share one slug
    const nameToSlug = new Map<string, string>();
    for (const v of vendorByName.values()) {
      nameToSlug.set(v.name, v.slug);
    }
    for (const board of boards) {
      const canonicalSlug = nameToSlug.get(board.vendor_name);
      if (canonicalSlug && canonicalSlug !== board.vendor_slug) {
        board.vendor_slug = canonicalSlug;
      }
    }

    const vendorMap = vendorByName;

    // 5. Build normalized partners
    const partnerLogoSources = new Map<string, string>();
    const partners: Partner[] = raw.partners.map((p) => {
      const slug = normalizeToSlug(p.Account_Name);
      if (p.logo_url) partnerLogoSources.set(slug, p.logo_url);
      return {
        name: p.Account_Name,
        tier: normalizePartnerTier(p.Partnership_Status),
        website: p.Website ?? null,
        logo_url: p.logo_url ? partnerLogoUrl(slug) : null,
        description: p.Description ?? null,
      };
    });

    // 6. Build normalized maintainers
    const maintainers: Maintainer[] = raw.maintainers
      .filter((m) => m.First_Name)
      .map((m) => ({
        name: m.First_Name!,
        avatar: m.Avatar,
        github: m.Github ?? null,
        teams: m.Team,
        boards_maintained: m.Maintaining
          ? m.Maintaining.split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        competences: m.Your_core_competences,
        days_since_last_activity: m.Days_since_last_activity ?? -1,
      }));

    // 7. Build redirect map — manual entries + auto-generated legacy paths
    const redirects: Record<string, string> = {};
    for (const entry of enrichment.redirects) {
      for (const legacyPath of entry.legacy) {
        redirects[legacyPath] = entry.canonical;
      }
    }

    // Auto-generate basic redirects from board slug. Full legacy URL
    // coverage (old WordPress paths, vendor renames, etc.) comes from
    // the legacy-redirects.json enrichment file populated from the old
    // WordPress database — see apps/api/data/legacy-redirects.json.
    const reservedPaths = new Set([
      '/',
      '/boards',
      '/vendors',
      '/partners',
      '/authors',
      '/donate',
      '/contact',
      '/update-data',
      '/sitemap.xml',
      '/robots.txt',
    ]);
    for (const board of boards) {
      const target = `/boards/${board.slug}`;
      const paths = [`/${board.slug}`, `/download/${board.slug}`];

      if (board.name) {
        const hyphenated = board.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        if (hyphenated && hyphenated !== board.slug) {
          paths.push(`/${hyphenated}`, `/download/${hyphenated}`);
        }
      }

      for (const p of paths) {
        if (p && p.length > 1 && !reservedPaths.has(p) && !redirects[p]) {
          redirects[p] = target;
        }
      }
    }

    return {
      boards,
      images: normalizedImages,
      vendors: [...vendorMap.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
      partners,
      maintainers,
      redirects,
      partnerLogoSources,
    };
  }

  private buildMaintainerBoardMap(maintainers: RawMaintainer[]): Map<string, BoardMaintainer[]> {
    const map = new Map<string, BoardMaintainer[]>();

    for (const m of maintainers) {
      if (!m.Maintaining || !m.First_Name) continue;

      const boardSlugs = m.Maintaining.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const maintainerRef: BoardMaintainer = {
        name: m.First_Name,
        avatar: m.Avatar,
        github: m.Github ?? null,
      };

      for (const slug of boardSlugs) {
        const existing = map.get(slug) ?? [];
        existing.push(maintainerRef);
        map.set(slug, existing);
      }
    }

    return map;
  }

  private buildPartnerMap(partners: RawPartner[]): Map<string, 'platinum' | 'gold' | 'silver'> {
    const map = new Map<string, 'platinum' | 'gold' | 'silver'>();

    for (const p of partners) {
      // Try to match partner to vendor by normalizing names
      const tier = normalizePartnerTier(p.Partnership_Status);
      const slug = normalizeToSlug(p.Account_Name);
      map.set(slug, tier);
    }

    return map;
  }

  private extractKernelBranches(
    images: RawImageAsset[],
    _kernelDescriptions: RawKernelDescription,
  ): KernelBranchInfo[] {
    const branches = new Map<string, { kernel_version: string }>();

    for (const img of images) {
      if (!branches.has(img.branch)) {
        branches.set(img.branch, { kernel_version: img.kernel_version });
      }
    }

    return [...branches.entries()].map(([branch, info]) => ({
      branch,
      kernel_version: info.kernel_version,
      description: null,
    }));
  }

  /**
   * Detect CPU architecture from board slug.
   * Raw data has no explicit arch field, so we derive from slug and URLs.
   */
  private detectArchitecture(slug: string, images: RawImageAsset[]): string | null {
    const s = slug.toLowerCase();

    // Known riscv64 boards
    if (
      s.includes('riscv') ||
      s.includes('visionfive') ||
      s.includes('star64') ||
      s.includes('licheerv') ||
      s.startsWith('spacemit') ||
      s.includes('sipeed')
    )
      return 'riscv64';

    // Known x86/amd64
    if (s.includes('uefi-x86') || s.includes('qemu-uefi-x86')) return 'amd64';

    // Check file URLs for explicit arch hints
    for (const img of images) {
      const url = img.file_url.toLowerCase();
      if (url.includes('armhf') || url.includes('armv7')) return 'armhf';
      if (url.includes('riscv64')) return 'riscv64';
      if (url.includes('amd64') || url.includes('x86-64') || url.includes('x86_64')) return 'amd64';
    }

    // Default: vast majority of Armbian boards are aarch64
    return 'aarch64';
  }

  private getLegacyPaths(slug: string, redirects: LegacyRedirectEntry[]): string[] {
    const entry = redirects.find((r) => r.board_id === slug);
    return entry?.legacy ?? [];
  }
}

function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function normalizePartnerTier(status: string): 'platinum' | 'gold' | 'silver' {
  const s = status.toLowerCase();
  if (s.includes('platinum')) return 'platinum';
  if (s.includes('gold')) return 'gold';
  return 'silver';
}

function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
