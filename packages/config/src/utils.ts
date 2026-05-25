/** Fisher-Yates shuffle. Returns a new array; input is not mutated. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** "1234" → "1.2K"; "1000" → "1K"; under 1000 returns the raw number as string. */
export function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
}

/** "https://example.com/path?x=1" → "example.com". Returns input unchanged for malformed URLs. */
export function extractDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

/**
 * Bytes → human-readable size. Shows 1 decimal for values below 10 in any
 * unit (e.g. "5.4 MB"), integer otherwise (e.g. "42 MB"). Binary units (1024).
 */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
