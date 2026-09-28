import { describe, it, expect } from 'vitest';
import type { RawImageAsset, RawBoardPerformanceEntry } from '@armbian/schemas';
import { RawBoardPerformanceResponseSchema } from '@armbian/schemas';
import { Normalizer } from './normalizer.js';

/** Minimal valid armbian-images.json asset for a single board/image. */
function makeImageAsset(overrides: Partial<RawImageAsset> = {}): RawImageAsset {
  return {
    board_slug: 'rockpro64',
    board_name: 'Rockpro64',
    board_vendor: 'pine64',
    board_support: 'Standard support',
    company_name: 'Pine64',
    company_website: 'https://pine64.org',
    company_logo: 'pine64.png',
    armbian_version: '26.8.3',
    file_url: 'https://example.com/Armbian_rockpro64_bookworm_current.img.xz',
    file_url_asc: '',
    file_url_sha: '',
    file_url_torrent: '',
    redi_url: '',
    redi_url_asc: '',
    redi_url_sha: '',
    redi_url_torrent: '',
    file_size: '123456',
    file_date: '2026-08-01T00:00:00Z',
    distro: 'bookworm',
    branch: 'current',
    variant: 'minimal',
    file_application: '',
    promoted: 'true',
    download_repository: 'main',
    file_extension: 'img.xz',
    kernel_version: '6.6.0',
    platinum: 'false',
    platinum_expired: 'false',
    platinum_until: '',
    ...overrides,
  };
}

function normalizeBoards(
  images: RawImageAsset[],
  boardPerformance: RawBoardPerformanceEntry[] = [],
) {
  const normalizer = new Normalizer();
  return normalizer.normalize(
    { images, partners: [], maintainers: [], kernelDescriptions: {}, boardPerformance },
    { redirects: [], enrichments: [] },
  ).boards;
}

describe('Normalizer — board-performance join', () => {
  it('attaches performance data to the board sharing its board_slug', () => {
    const perf: RawBoardPerformanceEntry = {
      board_slug: 'rockpro64',
      device: 'Rockpro64 01',
      last_good_test: '2026-08-29T19:35:37Z',
      run_url: 'https://github.com/armbian/autotests/actions/runs/1',
      image_version: '26.8.3',
      kernel: '6.6.0-current',
      summary: {
        cpu_mhz: 1800,
        cpu_aes_MBs: 500,
        ethernet_mbits: 941,
        ethernet_interfaces: 1,
      },
      cpu: { max_mhz: 1800, aes_MBs: 500, governor: 'performance' },
      network: {
        interfaces: [{ interface: 'eth0', wireless: false, up_mbits: 941, down_mbits: 941 }],
      },
    };

    // Real live payload must also validate against the raw feed schema.
    RawBoardPerformanceResponseSchema.parse({
      schema: 'armbian/board-performance/v1',
      source: 'https://github.armbian.com/board-performance.json',
      generated: '2026-09-28T00:00:00Z',
      boards_total: 1,
      boards: [perf],
    });

    const [board] = normalizeBoards([makeImageAsset()], [perf]);

    expect(board?.performance).not.toBeNull();
    expect(board?.performance?.device).toBe('Rockpro64 01');
    expect(board?.performance?.summary.cpu_mhz).toBe(1800);
    expect(board?.performance?.network?.interfaces?.[0]?.interface).toBe('eth0');
  });

  it('leaves performance null for a board with no matching entry (never tested)', () => {
    const [board] = normalizeBoards([makeImageAsset()], []);
    expect(board?.performance).toBeNull();
  });

  it('ignores a performance entry whose board_slug has no matching image board (orphan)', () => {
    const perf: RawBoardPerformanceEntry = {
      board_slug: 'some-retired-board',
      last_good_test: '2026-01-01T00:00:00Z',
    };
    const [board] = normalizeBoards([makeImageAsset()], [perf]);
    expect(board?.performance).toBeNull();
  });

  it('preserves a measured zero value instead of treating it as absent', () => {
    // A board can genuinely measure 0 Mbit/s (failed link); must not collapse to "not measured".
    const perf: RawBoardPerformanceEntry = {
      board_slug: 'rockpro64',
      last_good_test: '2026-08-29T19:35:37Z',
      summary: { ethernet_mbits: 0, ethernet_interfaces: 1 },
    };
    const [board] = normalizeBoards([makeImageAsset()], [perf]);
    expect(board?.performance?.summary.ethernet_mbits).toBe(0);
  });

  it('validates and normalizes the exact example payload from issue #47 (SpacemiT K3 Pico-ITX)', () => {
    const feed = {
      schema: 'armbian/board-performance/v1',
      source: 'https://github.armbian.com/board-performance.json',
      generated: '2026-09-01T00:00:00Z',
      boards_total: 1,
      boards: [
        {
          board_slug: 'k3picoitx',
          device: 'SpacemiT K3 Pico-ITX 01',
          last_good_test: '2026-08-29T19:35:37Z',
          run_url: 'https://github.com/armbian/autotests/actions/runs/33270498615',
          image_version: '26.8.3',
          kernel: '6.18.3-legacy-spacemit-k3',
          cpu: {
            max_mhz: 2200,
            aes_MBs: 796,
            temp_C: 61.0,
            governor: 'performance',
            min_mhz: 614,
            peak_mhz: 2200,
            tested: '2026-08-29T19:35:37Z',
            run_id: '33270498615',
          },
          memory: {
            copy_MBs: 12000,
            tested: '2026-08-29T19:35:37Z',
            run_id: '33270498615',
          },
          storage: {
            read_MBs: 40,
            write_MBs: 24,
            tested: '2026-08-29T19:35:37Z',
            run_id: '33270498615',
          },
          network: {
            interfaces: [
              {
                interface: 'eth0',
                type: '1000BASE-T (1GE)',
                up_mbits: 941,
                down_mbits: 941,
                wireless: false,
              },
              {
                interface: 'wlan0',
                type: 'IEEE 802.11ax (Wi-Fi 6)',
                up_mbits: 78,
                down_mbits: 154,
                wifi_chip: 'Realtek RTL8852BE',
                wifi_attach: 'PCIe',
                channel_mhz: 5240,
                channel_width_mhz: 80,
                wireless: true,
              },
            ],
            tested: '2026-08-29T19:35:37Z',
            run_id: '33270498615',
          },
          power: {
            unit: 'W',
            min: 13.4,
            avg: 14.4,
            max: 22.4,
            samples: 148,
            tested: '2026-08-29T19:35:37Z',
            run_id: '33270498615',
          },
          summary: {
            cpu_mhz: 2200,
            cpu_aes_MBs: 796,
            ethernet_mbits: 941,
            ethernet_interfaces: 1,
            wifi_mbits: 154,
            wifi_attach: 'PCIe',
            wifi_chip: 'Realtek RTL8852BE',
            power_min_w: 13.4,
            power_max_w: 22.4,
          },
        },
      ],
    };

    const parsed = RawBoardPerformanceResponseSchema.parse(feed);
    const [board] = normalizeBoards([makeImageAsset({ board_slug: 'k3picoitx' })], parsed.boards);

    expect(board?.performance?.summary.wifi_mbits).toBe(154);
    expect(board?.performance?.power?.max).toBe(22.4);
    expect(board?.performance?.network?.interfaces).toHaveLength(2);
  });

  it('defaults summary to an empty object when the upstream entry omits it entirely', () => {
    const perf: RawBoardPerformanceEntry = {
      board_slug: 'rockpro64',
      last_good_test: '2026-08-29T19:35:37Z',
    };
    const [board] = normalizeBoards([makeImageAsset()], [perf]);
    expect(board?.performance).not.toBeNull();
    expect(board?.performance?.summary).toEqual({});
    expect(board?.performance?.cpu).toBeNull();
  });
});
