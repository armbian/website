import { createHash } from 'node:crypto';
import type {
  BoardDetail,
  Image,
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

export class Normalizer {
  constructor() {}

  normalize(raw: RawSyncData, enrichment: EnrichmentData): NormalizedData {
    const enrichmentMap = new Map(enrichment.enrichments.map((e) => [e.slug, e]));
    const maintainerMap = this.buildMaintainerBoardMap(raw.maintainers);
    const partnerMap = this.buildPartnerMap(raw.partners);

    // 1. Extract unique boards from image entries
    const boardMap = new Map<string, {
      asset: RawImageAsset;
      images: RawImageAsset[];
      platinum: boolean;
    }>();

    for (const asset of raw.images) {
      // Only process actual image files (not .asc, .sha, .torrent)
      if (asset.file_extension !== 'img.xz') continue;

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

      const hasDesktop = boardImages.some(
        (img) => img.variant !== 'minimal' && img.variant !== '',
      );

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
        github_url: (!enrichment.boardConfigSlugs?.size || enrichment.boardConfigSlugs.has(slug))
          ? boardGithubUrl(slug, supportTier) : null,
        build_command: buildCommand(slug),
        legacy_paths: this.getLegacyPaths(slug, enrichment.redirects),
        maintainers: boardMaintainers,
        kernel_branches: kernelBranches,
      });
    }

    // 3. Build normalized images
    const normalizedImages: Image[] = [];
    for (const asset of raw.images) {
      if (asset.file_extension !== 'img.xz') continue;
      if (asset.file_url.includes('.fip.img.xz')) continue;

      normalizedImages.push({
        id: hashString(asset.file_url),
        board_slug: asset.board_slug,
        variant: asset.variant,
        distribution: asset.distro,
        release: asset.armbian_version,
        kernel_branch: asset.branch,
        kernel_version: asset.kernel_version,
        application: asset.file_application || null,
        promoted: asset.promoted === 'true',
        stability: asset.branch === 'edge' ? 'edge' : 'stable',
        download: {
          file_url: asset.redi_url || asset.file_url,
          direct_url: asset.file_url,
          sha_url: asset.redi_url_sha || asset.file_url_sha || null,
          asc_url: asset.redi_url_asc || asset.file_url_asc || null,
          torrent_url: asset.redi_url_torrent || asset.file_url_torrent || null,
          size_bytes: parseInt(asset.file_size, 10) || 0,
          updated_at: asset.file_date || new Date().toISOString(),
        },
      });
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
          ? m.Maintaining.split(',').map((s) => s.trim()).filter(Boolean)
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

    // Auto-generate legacy redirects for all boards
    const reservedPaths = new Set(['/', '/boards', '/vendors', '/partners', '/authors', '/donate', '/contact', '/sitemap.xml', '/robots.txt']);
    for (const board of boards) {
      const target = `/boards/${board.slug}`;
      const paths = [`/${board.slug}`, `/download/${board.slug}`];

      // Alias derived from the full board name, e.g. "NanoPC T6 LTS" → nanopc-t6-lts.
      // Stripped-vendor variants (e.g. "one", "pi", "cb1") are intentionally
      // skipped to avoid generic collisions with site pages and CMS slugs.
      if (board.name) {
        const fullHyphenated = board.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (fullHyphenated && fullHyphenated !== board.slug) {
          paths.push(`/${fullHyphenated}`, `/download/${fullHyphenated}`);
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
      vendors: [...vendorMap.values()],
      partners,
      maintainers,
      redirects,
      partnerLogoSources,
    };
  }

  private buildMaintainerBoardMap(
    maintainers: RawMaintainer[],
  ): Map<string, BoardMaintainer[]> {
    const map = new Map<string, BoardMaintainer[]>();

    for (const m of maintainers) {
      if (!m.Maintaining || !m.First_Name) continue;

      const boardSlugs = m.Maintaining.split(',').map((s) => s.trim()).filter(Boolean);
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
    if (s.includes('riscv') || s.includes('visionfive') || s.includes('star64')
      || s.includes('licheerv') || s.startsWith('spacemit')
      || s.includes('sipeed')) return 'riscv64';

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

