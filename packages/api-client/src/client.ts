import type {
  BoardSummary,
  BoardDetail,
  Image,
  Vendor,
  Partner,
  Maintainer,
  ImageFilterParams,
  HealthResponse,
  ApiMeta,
  SupportTier,
} from '@armbian/schemas';

/** Client-side filter params — all fields optional (server applies defaults) */
export interface BoardFilterInput {
  vendor?: string;
  architecture?: string;
  support?: SupportTier;
  search?: string;
  sort?: 'name' | 'popularity' | 'support' | 'random';
  promoted?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ZohoFormTokensResponse {
  data: {
    xnQsjsdp: string;
    xmIwtLD: string;
    actionType: string;
    recaptchaSiteKey: string;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta: ApiMeta & { page: number; limit: number };
}

export interface VendorWithBoards extends Vendor {
  boards: BoardSummary[];
}

export class ArmbianApiClient {
  private baseUrl: string;
  private timeout: number;
  private fetchImpl: typeof globalThis.fetch;
  private clientId: string;
  private forwardedFor?: string;

  constructor(
    baseUrl: string,
    options?: {
      timeout?: number;
      fetch?: typeof globalThis.fetch;
      clientId?: string;
      forwardedFor?: string;
    },
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = options?.timeout ?? 10_000;
    this.fetchImpl = options?.fetch ?? globalThis.fetch;
    this.clientId = options?.clientId ?? 'armbian-website';
    this.forwardedFor = options?.forwardedFor;
  }

  async getBoards(
    params?: BoardFilterInput & { page?: number; limit?: number },
  ): Promise<PaginatedApiResponse<BoardSummary[]>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.fetch(`/api/v1/boards${query}`);
  }

  async getBoard(slug: string): Promise<ApiResponse<BoardDetail>> {
    return this.fetch(`/api/v1/boards/${encodeURIComponent(slug)}`);
  }

  async getBoardImages(slug: string, params?: ImageFilterParams): Promise<ApiResponse<Image[]>> {
    const query = buildQuery(params);
    return this.fetch(`/api/v1/boards/${encodeURIComponent(slug)}/images${query}`);
  }

  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    return this.fetch('/api/v1/vendors');
  }

  async getVendor(slug: string): Promise<ApiResponse<VendorWithBoards>> {
    return this.fetch(`/api/v1/vendors/${encodeURIComponent(slug)}`);
  }

  async search(query: string): Promise<ApiResponse<BoardSummary[]>> {
    return this.fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
  }

  async getPartners(): Promise<ApiResponse<Partner[]>> {
    return this.fetch('/api/v1/partners');
  }

  async getMaintainers(): Promise<ApiResponse<Maintainer[]>> {
    return this.fetch('/api/v1/maintainers');
  }

  async getRedirects(): Promise<ApiResponse<Record<string, string>>> {
    return this.fetch('/api/v1/redirects');
  }

  async getHealth(): Promise<HealthResponse> {
    return this.fetch('/api/v1/health');
  }

  async getHomePage(): Promise<
    ApiResponse<{
      platinum_boards: BoardSummary[];
      promoted_boards: BoardSummary[];
      partners: Partner[];
      stats: { boards: number; images: number; vendors: number };
    }>
  > {
    return this.fetch('/api/v1/pages/home');
  }

  async getBoardsPage(): Promise<
    ApiResponse<{
      boards: BoardSummary[];
      vendors: Vendor[];
      total: number;
    }>
  > {
    return this.fetch('/api/v1/pages/boards');
  }

  async getBoardsInit(): Promise<
    ApiResponse<{
      boards: BoardSummary[];
      platinumBoards: BoardSummary[];
      vendors: Vendor[];
      total: number;
      tierCounts: Record<string, number>;
    }>
  > {
    return this.fetch('/api/v1/pages/boards-init');
  }

  async getStats(): Promise<{
    data: {
      boards: number;
      images: number;
      vendors: number;
      github_stars: number | null;
      distro_releases: { debian: string[]; ubuntu: string[] };
      sample_image: {
        board_slug: string;
        kernel_version: string;
        kernel_branch: string;
        distribution: string;
        variant: string;
        file_url: string;
        sha_url: string | null;
      } | null;
    };
  }> {
    return this.fetch('/api/v1/stats');
  }

  async getContactFormTokens(): Promise<ZohoFormTokensResponse> {
    return this.fetch('/api/v1/contact-form-tokens');
  }

  async getUpdateDataFormTokens(): Promise<ZohoFormTokensResponse> {
    return this.fetch('/api/v1/update-data-form-tokens');
  }

  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Armbian-Client': this.clientId,
      };
      if (this.forwardedFor) headers['X-Forwarded-For'] = this.forwardedFor;

      const response = await this.fetchImpl(url, {
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new ApiClientError(response.status, response.statusText, body);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`API error ${status}: ${statusText}`);
    this.name = 'ApiClientError';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }
  return `?${search.toString()}`;
}
