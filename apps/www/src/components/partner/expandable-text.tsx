'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ExpandableText({ text, maxLength = 120 }: { text: string; maxLength?: number }) {
  const t = useTranslations('partners');
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;

  if (!needsTruncation) {
    return <p className="text-sm leading-relaxed text-[rgb(var(--fg-2))]">{text}</p>;
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-[rgb(var(--fg-2))]">
        {expanded ? text : `${text.slice(0, maxLength).trimEnd()}...`}
      </p>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-1.5 text-xs font-semibold text-[rgb(var(--brand))] hover:underline transition-colors"
      >
        {expanded ? t('read_less') : t('read_more')}
      </button>
    </div>
  );
}
