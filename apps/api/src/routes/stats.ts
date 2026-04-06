import type { FastifyInstance } from 'fastify';
import '../types.js';

export function registerStatsRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/stats
   * Public stats: board/image/vendor counts, GitHub stars, sample image for terminal snippets.
   * GitHub stars are fetched by SyncService to avoid live third-party calls.
   */
  server.get('/api/v1/stats', (_request, reply) => {
    const { boardCount, imageCount, vendorCount, githubStars } = server.store.metadata;
    const sample = server.store.getSampleImage();

    void reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    return {
      data: {
        boards: boardCount,
        images: imageCount,
        vendors: vendorCount,
        github_stars: githubStars,
        distro_releases: server.store.getDistroReleases(),
        sample_image: sample
          ? {
              board_slug: sample.board_slug,
              kernel_version: sample.kernel_version,
              kernel_branch: sample.kernel_branch,
              distribution: sample.distribution,
              variant: sample.variant,
              file_url: sample.download.file_url,
              sha_url: sample.download.sha_url,
            }
          : null,
      },
    };
  });
}
