import type { FastifyInstance } from 'fastify';
import '../types.js';

const GITHUB_REPO_BASE = 'https://api.github.com/repos/armbian/imager';
const GITHUB_REPO_URL = GITHUB_REPO_BASE;
const GITHUB_RELEASE_URL = `${GITHUB_REPO_BASE}/releases/latest`;

const GITHUB_HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'armbian-website',
};

interface GithubAsset {
  name?: string;
  browser_download_url?: string;
  size?: number;
  content_type?: string;
}

interface GithubRepoResponse {
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  html_url?: string;
  description?: string | null;
  pushed_at?: string;
}

interface GithubReleaseResponse {
  tag_name?: string;
  name?: string | null;
  html_url?: string;
  published_at?: string;
  body?: string | null;
  assets?: GithubAsset[];
}

// NOTE: this shape must stay in sync with `ImagerRepoPayload` exported
// by @armbian/api-client. The api server cannot import from api-client
// (api-client → schemas, server → schemas — adding api-client here
// would invert the dependency graph), so the two definitions are
// duplicated by design.
interface RepoPayload {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  html_url: string;
  description: string | null;
  pushed_at: string | null;
  tag_name: string | null;
  release_name: string | null;
  release_url: string | null;
  published_at: string | null;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string | null;
  }>;
}

const FRESH_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
let cached: { payload: RepoPayload; fetchedAt: number } | null = null;
// Single-flight guard: when the cache is cold and several requests
// arrive together, share one upstream fetch instead of stampeding
// GitHub (which has a 60 req/h anonymous ceiling).
let inflight: Promise<RepoPayload> | null = null;

async function fetchUpstreamRepo(): Promise<RepoPayload> {
  // 10s timeout because two parallel GitHub calls under transient
  // network pressure can easily exceed 5s on a cold cache.
  const [repoRes, releaseRes] = await Promise.all([
    fetch(GITHUB_REPO_URL, { headers: GITHUB_HEADERS, signal: AbortSignal.timeout(10000) }),
    fetch(GITHUB_RELEASE_URL, { headers: GITHUB_HEADERS, signal: AbortSignal.timeout(10000) }),
  ]);

  if (!repoRes.ok) throw new Error(`GitHub repo ${repoRes.status}`);
  if (!releaseRes.ok) throw new Error(`GitHub release ${releaseRes.status}`);

  const [repo, release] = (await Promise.all([repoRes.json(), releaseRes.json()])) as [
    GithubRepoResponse,
    GithubReleaseResponse,
  ];

  return {
    stargazers_count: repo.stargazers_count ?? 0,
    forks_count: repo.forks_count ?? 0,
    open_issues_count: repo.open_issues_count ?? 0,
    html_url: repo.html_url ?? 'https://github.com/armbian/imager',
    description: repo.description ?? null,
    pushed_at: repo.pushed_at ?? null,
    tag_name: release.tag_name ?? null,
    release_name: release.name ?? null,
    release_url: release.html_url ?? null,
    published_at: release.published_at ?? null,
    assets: (release.assets ?? []).map((a) => ({
      name: a.name ?? '',
      browser_download_url: a.browser_download_url ?? '',
      size: a.size ?? 0,
      content_type: a.content_type ?? null,
    })),
  };
}

/**
 * Endpoint used by the Armbian Imager site for the GitHub repo + latest
 * release info (download links, stargazer count) — proxied server-side
 * so the browser never hits api.github.com directly. Public anonymous
 * reads with a tiered cache:
 *   - fresh: 5 min, return as-is
 *   - stale (cache hit older than 5 min): try refresh, fall back to
 *     cached if upstream fails
 *   - cold + upstream fails: 502
 *
 * GitHub's 60 req/h anonymous rate limit means we MUST cache; without it
 * a few page reloads per minute is enough to lock out the proxy.
 *
 * For board / image / vendor data the imager calls the existing
 * /api/v1/boards, /api/v1/boards/:slug/images and /api/v1/stats routes
 * directly — no separate proxy needed.
 */
export function registerImagerRoutes(server: FastifyInstance): void {
  server.get('/api/v1/imager/repo', async (_request, reply) => {
    const now = Date.now();
    const isFresh = cached && now - cached.fetchedAt < FRESH_TTL_MS;
    const isWithinStaleWindow = cached && now - cached.fetchedAt < STALE_TTL_MS;

    if (isFresh) {
      void reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return { data: cached!.payload };
    }

    try {
      if (!inflight) {
        inflight = fetchUpstreamRepo()
          .then((payload) => {
            cached = { payload, fetchedAt: Date.now() };
            return payload;
          })
          .finally(() => {
            inflight = null;
          });
      }
      const payload = await inflight;
      void reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return { data: payload };
    } catch (err) {
      if (isWithinStaleWindow) {
        server.log.warn(
          { err, ageMs: now - cached!.fetchedAt },
          'GitHub upstream failed, serving stale cached payload',
        );
        void reply.header('Cache-Control', 'public, max-age=60');
        return { data: cached!.payload };
      }
      server.log.warn({ err }, 'GitHub upstream failed and no cached payload available');
      void reply
        .status(502)
        .header('Cache-Control', 'no-store')
        .send({ error: 'Upstream GitHub API unreachable', statusCode: 502 });
      return;
    }
  });
}
