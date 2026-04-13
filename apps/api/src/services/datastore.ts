import type {
  BoardSummary,
  BoardDetail,
  Image,
  Vendor,
  Partner,
  Maintainer,
  BoardFilterParams,
  ImageFilterParams,
} from '@armbian/schemas';
import MiniSearch from 'minisearch';

export interface ContactFormTokens {
  xnQsjsdp: string;
  xmIwtLD: string;
  actionType: string;
  recaptchaSiteKey: string;
}

export interface SyncMetadata {
  lastSync: Date | null;
  boardCount: number;
  imageCount: number;
  vendorCount: number;
  githubStars: number | null;
  contactFormTokens: ContactFormTokens | null;
  sourceStatuses: Record<
    string,
    { status: 'ok' | 'error' | 'stale'; lastFetch: Date | null; error?: string }
  >;
}

export interface NormalizedData {
  boards: BoardDetail[];
  images: Image[];
  vendors: Vendor[];
  partners: Partner[];
  maintainers: Maintainer[];
  redirects: Record<string, string>;
  partnerLogoSources: Map<string, string>;
}

export class DataStore {
  private boardsMap = new Map<string, BoardDetail>();
  private boardsList: BoardSummary[] = [];
  private vendorsMap = new Map<string, Vendor>();
  private vendorsList: Vendor[] = [];
  private imagesByBoard = new Map<string, Image[]>();
  private partnersList: Partner[] = [];
  private partnerLogoSources = new Map<string, string>();
  private maintainersList: Maintainer[] = [];
  private redirectsMap = new Map<string, string>();
  private searchIndex: MiniSearch;
  private _metadata: SyncMetadata = {
    lastSync: null,
    boardCount: 0,
    imageCount: 0,
    vendorCount: 0,
    githubStars: null,
    contactFormTokens: null,
    sourceStatuses: {},
  };

  constructor() {
    this.searchIndex = new MiniSearch({
      fields: ['name', 'vendor_name', 'soc', 'slug'],
      storeFields: ['slug'],
      searchOptions: {
        boost: { name: 3, slug: 2, vendor_name: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  /** Atomically replace all data */
  load(data: NormalizedData): void {
    // Build maps
    const boardsMap = new Map<string, BoardDetail>();
    const boardsList: BoardSummary[] = [];
    const vendorsMap = new Map<string, Vendor>();
    const imagesByBoard = new Map<string, Image[]>();

    for (const board of data.boards) {
      boardsMap.set(board.slug, board);
      boardsList.push(toBoardSummary(board));
    }

    for (const vendor of data.vendors) {
      vendorsMap.set(vendor.slug, vendor);
    }

    for (const image of data.images) {
      const existing = imagesByBoard.get(image.board_slug) ?? [];
      existing.push(image);
      imagesByBoard.set(image.board_slug, existing);
    }

    const redirectsMap = new Map(Object.entries(data.redirects));

    // Sort boards by popularity (image count descending)
    boardsList.sort((a, b) => b.image_count - a.image_count);

    // Build search index
    const search = new MiniSearch({
      fields: ['name', 'vendor_name', 'soc', 'slug'],
      storeFields: ['slug'],
      searchOptions: {
        boost: { name: 3, slug: 2, vendor_name: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
    search.addAll(
      data.boards.map((b) => ({
        id: b.slug,
        name: b.name,
        vendor_name: b.vendor_name,
        soc: b.soc ?? '',
        slug: b.slug,
      })),
    );

    // Atomic swap
    this.boardsMap = boardsMap;
    this.boardsList = boardsList;
    this.vendorsMap = vendorsMap;
    this.vendorsList = data.vendors;
    this.imagesByBoard = imagesByBoard;
    this.partnersList = data.partners;
    this.partnerLogoSources = data.partnerLogoSources;
    this.maintainersList = data.maintainers;
    this.redirectsMap = redirectsMap;
    this.searchIndex = search;

    this._metadata = {
      ...this._metadata,
      lastSync: new Date(),
      boardCount: data.boards.length,
      imageCount: data.images.length,
      vendorCount: data.vendors.length,
    };
  }

  // --- Board queries ---

  getBoards(params?: BoardFilterParams): { boards: BoardSummary[]; total: number } {
    let results = [...this.boardsList];

    if (params?.vendor) {
      results = results.filter((b) => b.vendor_slug === params.vendor);
    }
    if (params?.architecture) {
      results = results.filter((b) => b.architecture === params.architecture);
    }
    if (params?.support) {
      results = results.filter((b) => b.support_tier === params.support);
    }
    if (params?.promoted !== undefined) {
      results = results.filter((b) => b.promoted === params.promoted);
    }
    if (params?.sort === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params?.sort === 'support') {
      results.sort((a, b) => tierSortOrder(a.support_tier) - tierSortOrder(b.support_tier));
    }
    // default sort is by popularity (already sorted)

    return { boards: results, total: results.length };
  }

  getBoard(slug: string): BoardDetail | undefined {
    return this.boardsMap.get(slug);
  }

  getBoardImages(slug: string, params?: ImageFilterParams): Image[] {
    let images = this.imagesByBoard.get(slug) ?? [];

    if (params?.variant) {
      images = images.filter((i) => i.variant === params.variant);
    }
    if (params?.distribution) {
      images = images.filter((i) => i.distribution === params.distribution);
    }
    if (params?.branch) {
      images = images.filter((i) => i.kernel_branch === params.branch);
    }
    if (params?.promoted !== undefined) {
      images = images.filter((i) => i.promoted === params.promoted);
    }

    return images;
  }

  getBoardCount(): number {
    return this.boardsMap.size;
  }

  getImageCount(): number {
    let count = 0;
    for (const images of this.imagesByBoard.values()) {
      count += images.length;
    }
    return count;
  }

  /** Get a sample promoted image (for homepage terminal snippets) */
  getSampleImage(): Image | undefined {
    for (const images of this.imagesByBoard.values()) {
      const promoted = images.find((i) => i.promoted && i.variant === 'minimal');
      if (promoted) return promoted;
    }
    // Fallback: any promoted image
    for (const images of this.imagesByBoard.values()) {
      const promoted = images.find((i) => i.promoted);
      if (promoted) return promoted;
    }
    // Last resort: first image
    for (const images of this.imagesByBoard.values()) {
      if (images[0]) return images[0];
    }
    return undefined;
  }

  // --- Vendor queries ---

  getVendors(): Vendor[] {
    return this.vendorsList;
  }

  getVendor(slug: string): Vendor | undefined {
    return this.vendorsMap.get(slug);
  }

  getVendorBoards(vendorSlug: string): BoardSummary[] {
    return this.boardsList.filter((b) => b.vendor_slug === vendorSlug);
  }

  // --- Search ---

  search(query: string): BoardSummary[] {
    if (query.length < 2) return [];
    const results = this.searchIndex.search(query);
    return results
      .map((r) => this.boardsMap.get(r.id as string))
      .filter((b): b is BoardDetail => b !== undefined)
      .map(toBoardSummary);
  }

  /** Get top distro codenames by image count, grouped by family */
  getDistroReleases(): { debian: string[]; ubuntu: string[] } {
    const counts: Record<string, number> = {};
    for (const imgs of this.imagesByBoard.values())
      for (const img of imgs) {
        counts[img.distribution] = (counts[img.distribution] || 0) + 1;
      }

    const debian: [string, number][] = [];
    const ubuntu: [string, number][] = [];
    const debianCodenames = new Set(['bullseye', 'bookworm', 'trixie', 'forky', 'sid']);
    const ubuntuCodenames = new Set(['focal', 'jammy', 'noble', 'oracular', 'plucky']);

    for (const [distro, count] of Object.entries(counts)) {
      if (distro === 'sid') continue;
      if (debianCodenames.has(distro)) debian.push([distro, count]);
      else if (ubuntuCodenames.has(distro)) ubuntu.push([distro, count]);
    }

    return {
      debian: debian
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name),
      ubuntu: ubuntu
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name),
    };
  }

  // --- Partners & Maintainers ---

  getPartners(): Partner[] {
    return this.partnersList;
  }

  getPartnerLogoSource(slug: string): string | undefined {
    return this.partnerLogoSources.get(slug);
  }

  getMaintainers(): Maintainer[] {
    return this.maintainersList;
  }

  // --- Redirects ---

  getRedirects(): Record<string, string> {
    return Object.fromEntries(this.redirectsMap);
  }

  resolveRedirect(path: string): string | undefined {
    return this.redirectsMap.get(path);
  }

  // --- Metadata ---

  get metadata(): SyncMetadata {
    return this._metadata;
  }

  updateSourceStatus(source: string, status: 'ok' | 'error' | 'stale', error?: string): void {
    this._metadata.sourceStatuses[source] = {
      status,
      lastFetch:
        status === 'ok' ? new Date() : (this._metadata.sourceStatuses[source]?.lastFetch ?? null),
      error,
    };
  }
}

function toBoardSummary(board: BoardDetail): BoardSummary {
  return {
    slug: board.slug,
    name: board.name,
    vendor_slug: board.vendor_slug,
    vendor_name: board.vendor_name,
    support_tier: board.support_tier,
    image_count: board.image_count,
    has_desktop: board.has_desktop,
    promoted: board.promoted,
    image_url: board.image_url,
    soc: board.soc,
    architecture: board.architecture,
    summary: board.summary,
  };
}

const TIER_ORDER: Record<string, number> = {
  platinum: 1,
  standard: 2,
  community: 3,
  wip: 4,
  eos: 5,
  tvb: 6,
};

function tierSortOrder(tier: string): number {
  return TIER_ORDER[tier] ?? 99;
}
