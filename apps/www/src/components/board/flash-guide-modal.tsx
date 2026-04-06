'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, X, CheckCircle } from 'lucide-react';

interface FlashGuideModalProps {
  title: string;
  content: string;
  prerequisites: string[];
  buttonLabel: string;
}

export function FlashGuideModal({ title, content, prerequisites, buttonLabel }: FlashGuideModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))] w-full text-left border-t border-[rgb(var(--border)/0.3)]"
      >
        <BookOpen size={16} strokeWidth={1.5} className="opacity-50 shrink-0" />
        <span className="flex-1">{buttonLabel}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">Guide</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] shadow-2xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border)/0.3)] bg-[rgb(var(--bg))]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen size={16} strokeWidth={2} className="text-emerald-500" />
                </div>
                <h2 className="text-base font-bold">{title}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgb(var(--bg-sub))] transition-colors"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} className="text-[rgb(var(--fg-3))]" />
              </button>
            </div>

            <div className="px-6 py-6">
              {prerequisites.length > 0 && (
                <div className="mb-6 rounded-xl bg-[rgb(var(--bg-sub))] border border-[rgb(var(--border)/0.3)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-3">
                    Prerequisites
                  </p>
                  <ul className="space-y-2">
                    {prerequisites.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--fg-2))]">
                        <CheckCircle size={14} strokeWidth={2} className="text-emerald-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* content is pre-sanitized server-side via sanitizeCmsHtml() in boards/[slug]/page.tsx */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
