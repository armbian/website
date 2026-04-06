'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = address;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group mt-auto flex items-center gap-2 rounded-lg bg-[rgb(var(--bg-sub))] border border-[rgb(var(--border)/0.5)] px-3 py-2.5 text-left transition-all hover:border-[rgb(var(--brand)/0.3)] hover:bg-[rgb(var(--bg-el))]"
    >
      <span className="text-[10px] font-mono text-[rgb(var(--fg-3))] truncate flex-1 select-all">
        {address}
      </span>
      <span className="shrink-0 transition-colors">
        {copied ? (
          <Check size={14} strokeWidth={2} className="text-emerald-500" />
        ) : (
          <Copy size={14} strokeWidth={2} className="text-[rgb(var(--fg-3))] group-hover:text-[rgb(var(--brand))]" />
        )}
      </span>
    </button>
  );
}
