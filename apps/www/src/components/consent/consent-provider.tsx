'use client';

import type { ReactNode } from 'react';
import { ConsentContext, useConsentSubscription } from '@/lib/consent';

export function ConsentProvider({ children }: { children: ReactNode }) {
  const value = useConsentSubscription();
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
