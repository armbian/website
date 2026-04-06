'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  announcementId: string;
  className?: string;
  children: React.ReactNode;
}

export function AnnouncementDismiss({ announcementId, className, children }: Props) {
  // Start dismissed to avoid hydration mismatch (localStorage not available on server)
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const key = `announcement-dismissed-${announcementId}`;
    setDismissed(localStorage.getItem(key) === 'true');
  }, [announcementId]);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(`announcement-dismissed-${announcementId}`, 'true');
    setDismissed(true);
  };

  return (
    <div className={className}>
      <div className="relative">
        {children}
        <button
          onClick={handleDismiss}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
