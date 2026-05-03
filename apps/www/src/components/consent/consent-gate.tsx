'use client';

import type { ReactNode } from 'react';
import { useConsent, type ConsentCategory } from '@/lib/consent';

interface ConsentGateProps {
  category: ConsentCategory;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ConsentGate({ category, children, fallback = null }: ConsentGateProps) {
  const { isAllowed, hydrated } = useConsent();
  if (!hydrated) return <>{fallback}</>;
  return <>{isAllowed(category) ? children : fallback}</>;
}
