'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const CONSENT_VERSION = 1;
export const CONSENT_KEY = 'armbian-consent';
const CONSENT_EVENT = 'armbian-consent-change';

export type ConsentCategory = 'necessary' | 'functional';

export interface Consent {
  necessary: true;
  functional: boolean;
  timestamp: number;
  version: number;
}

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Partial<Consent>;
    if (obj.version !== CONSENT_VERSION) return null;
    return {
      necessary: true,
      functional: obj.functional === true,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : 0,
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function writeConsent(input: { functional: boolean }): Consent {
  const consent: Consent = {
    necessary: true,
    functional: input.functional,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
    } catch {
      /* storage disabled */
    }
  }
  return consent;
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
  } catch {
    /* storage disabled */
  }
}

function consentEquals(a: Consent | null, b: Consent | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.functional === b.functional && a.timestamp === b.timestamp && a.version === b.version;
}

export interface ConsentSnapshot {
  consent: Consent | null;
  hydrated: boolean;
  isAllowed: (category: ConsentCategory) => boolean;
}

export const ConsentContext = createContext<ConsentSnapshot | null>(null);

/** Single-subscription hook used by ConsentProvider. Do not call directly
 *  in leaf components — use useConsent() so all consumers share one
 *  localStorage subscription instead of creating one per component. */
export function useConsentSubscription(): ConsentSnapshot {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setHydrated(true);

    const apply = (next: Consent | null) =>
      setConsent((prev) => (consentEquals(prev, next) ? prev : next));
    const onCustom = (e: Event) => {
      apply((e as CustomEvent<Consent | null>).detail ?? readConsent());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) apply(readConsent());
    };
    window.addEventListener(CONSENT_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isAllowed = useCallback(
    (category: ConsentCategory): boolean => {
      if (category === 'necessary') return true;
      return consent?.[category] === true;
    },
    [consent],
  );

  return { consent, hydrated, isAllowed };
}

export function useConsent(): ConsentSnapshot {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent() must be used inside <ConsentProvider>.');
  }
  return ctx;
}
