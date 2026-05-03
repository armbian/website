'use client';

import { useEffect, useState } from 'react';
import type { ImagerRepoPayload } from '@armbian/api-client';
import { apiClient } from '../_lib/api';

const SUCCESS_TTL_MS = 60_000;
const ERROR_TTL_MS = 10_000;

interface CacheEntry {
  value: ImagerRepoPayload | null;
  ok: boolean;
  at: number;
}

let cached: CacheEntry | null = null;
let inflight: Promise<ImagerRepoPayload | null> | null = null;

const isBrowser = typeof window !== 'undefined';

function isFresh(entry: CacheEntry, now: number): boolean {
  const ttl = entry.ok ? SUCCESS_TTL_MS : ERROR_TTL_MS;
  return now - entry.at < ttl;
}

function getImagerRepo(): Promise<ImagerRepoPayload | null> {
  const now = Date.now();
  if (cached && isFresh(cached, now)) {
    return Promise.resolve(cached.value);
  }
  if (inflight) return inflight;
  inflight = apiClient
    .getImagerRepo()
    .then(({ data }) => {
      cached = { value: data, ok: true, at: Date.now() };
      return data;
    })
    .catch((err) => {
      cached = { value: null, ok: false, at: Date.now() };
      throw err;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Shared GitHub release accessor. Module-scope cache + in-flight dedupe
 * so multiple consumers (Downloads, Testimonials) issue one network
 * call per minute. Cache is browser-only — reading on the server would
 * leak request A's payload into request B's hydrated HTML.
 */
export function useImagerRepo() {
  const [data, setData] = useState<ImagerRepoPayload | null>(() =>
    isBrowser && cached?.ok ? (cached.value ?? null) : null,
  );
  const [loading, setLoading] = useState(() => !(isBrowser && cached?.ok));
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getImagerRepo()
      .then((value) => {
        if (alive) setData(value);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}
