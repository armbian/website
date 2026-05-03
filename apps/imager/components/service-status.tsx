'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { HEALTH_URL } from '@/lib/api';

/* ─── types ───────────────────────────────────────── */
type ServiceState = 'up' | 'down' | 'checking';

interface ServiceEntry {
  name: string;
  url: string;
  status: ServiceState;
  responseMs: number | null;
  checkedAt: Date | null;
}

// Hosts probed must accept HEAD or be a real CDN that returns a body
// for `<img>`-style requests. paste.armbian.com replies 405 to HEAD —
// with mode: 'no-cors' the response is opaque so the badge would lie
// and report "Operational". Drop until we have a server-side aggregator.
const SERVICES: { name: string; url: string }[] = [
  { name: 'Armbian API', url: HEALTH_URL },
  { name: 'Board Images CDN', url: 'https://cache.armbian.com/images/272/rockpi-s.png' },
  { name: 'Documentation', url: 'https://docs.armbian.com' },
  { name: 'Forum', url: 'https://forum.armbian.com' },
];

const TIMEOUT_MS = 10_000;
const REFRESH_INTERVAL_MS = 60_000;

/* ─── hook ────────────────────────────────────────── */
function useServiceStatus() {
  const [services, setServices] = useState<ServiceEntry[]>(() =>
    SERVICES.map((s) => ({ ...s, status: 'checking', responseMs: null, checkedAt: null })),
  );
  const abortRef = useRef<AbortController | null>(null);

  const checkAll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // mark all as checking
    setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' as const })));

    const results = await Promise.allSettled(
      SERVICES.map(async (svc) => {
        const start = performance.now();
        try {
          await fetch(svc.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(TIMEOUT_MS)]),
          });
          const elapsed = Math.round(performance.now() - start);
          return { ...svc, status: 'up' as const, responseMs: elapsed, checkedAt: new Date() };
        } catch {
          const elapsed = Math.round(performance.now() - start);
          return { ...svc, status: 'down' as const, responseMs: elapsed, checkedAt: new Date() };
        }
      }),
    );

    if (controller.signal.aborted) return;

    setServices(
      results.map((r) =>
        r.status === 'fulfilled'
          ? r.value
          : { ...SERVICES[0], status: 'down' as const, responseMs: null, checkedAt: new Date() },
      ),
    );
  }, []);

  useEffect(() => {
    checkAll();
    const id = setInterval(checkAll, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [checkAll]);

  return { services, refresh: checkAll };
}

/* ─── helpers ─────────────────────────────────────── */
function getOverallStatus(services: ServiceEntry[]) {
  const total = services.length;
  const down = services.filter((s) => s.status === 'down').length;
  const checking = services.some((s) => s.status === 'checking');
  if (checking) return 'checking' as const;
  if (down === 0) return 'allUp' as const;
  if (down > total / 2) return 'majorOutage' as const;
  return 'degraded' as const;
}

function StatusDot({ status }: { status: 'up' | 'down' | 'checking' }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        status === 'up' && 'bg-emerald-500',
        status === 'down' && 'bg-red-500',
        status === 'checking' && 'bg-yellow-500 animate-pulse',
      )}
    />
  );
}

/* ─── badge (footer pill) ─────────────────────────── */
export function ServiceStatusBadge() {
  const { services, refresh } = useServiceStatus();
  const [open, setOpen] = useState(false);
  const overall = getOverallStatus(services);

  const label = {
    checking: 'Checking services…',
    allUp: 'All systems operational',
    degraded: 'Some services degraded',
    majorOutage: 'Major outage',
  }[overall];

  const dotColor = {
    checking: 'bg-yellow-500 animate-pulse',
    allUp: 'bg-emerald-500',
    degraded: 'bg-yellow-500',
    majorOutage: 'bg-red-500',
  }[overall];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors',
          'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
        )}
      >
        <span className={cn('inline-block h-2 w-2 rounded-full', dotColor)} />
        {label}
      </button>

      {open && (
        <ServiceStatusModal
          services={services}
          onClose={() => setOpen(false)}
          onRefresh={refresh}
        />
      )}
    </>
  );
}

/* ─── modal ───────────────────────────────────────── */
function ServiceStatusModal({
  services,
  onClose,
  onRefresh,
}: {
  services: ServiceEntry[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const panelRef = useFocusTrap({ enabled: true, onEscape: onClose });

  const lastCheck = services.find((s) => s.checkedAt)?.checkedAt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-status-title"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* panel */}
      <div
        ref={panelRef}
        className={cn(
          'bg-card text-card-foreground relative w-full max-w-md rounded-xl border shadow-lg',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="service-status-title" className="text-sm font-semibold">
            Service Status
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* service list */}
        <ul className="divide-border divide-y px-5">
          {services.map((svc) => (
            <li key={svc.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                <StatusDot status={svc.status} />
                <span className="text-sm">{svc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {svc.responseMs !== null && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {svc.responseMs}ms
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    svc.status === 'up' && 'text-emerald-600 dark:text-emerald-400',
                    svc.status === 'down' && 'text-red-600 dark:text-red-400',
                    svc.status === 'checking' && 'text-yellow-600 dark:text-yellow-400',
                  )}
                >
                  {svc.status === 'up' && 'Operational'}
                  {svc.status === 'down' && 'Down'}
                  {svc.status === 'checking' && 'Checking…'}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* footer */}
        {lastCheck && (
          <div className="text-muted-foreground border-t px-5 py-3 text-[11px]">
            Last checked {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
