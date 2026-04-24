'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  name: string;
  options: readonly MultiSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Accessible multi-select that writes the selected values as a
 * semicolon-joined string into a hidden native `<input name={name}>` so a
 * classic (uncontrolled) `<form>` submission picks them up — the same
 * protocol Zoho's own form script uses for `multipick` fields.
 */
export function MultiSelect({ name, options, placeholder, ariaLabel }: MultiSelectProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const available = options.filter((o) => !selected.includes(o.value));

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function remove(value: string) {
    setSelected((prev) => prev.filter((v) => v !== value));
  }

  function onTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight(0);
    }
  }

  function onListKey(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, available.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = available[highlight];
      if (opt) toggle(opt.value);
    }
  }

  const triggerClass = [
    'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-sub))]',
    'px-4 py-3 text-sm outline-none transition-all text-left min-h-[52px]',
    'placeholder:text-[rgb(var(--fg-3))]',
    'focus:border-[rgb(var(--brand)/0.5)] focus:ring-1 focus:ring-[rgb(var(--brand)/0.2)]',
    'hover:border-[rgb(var(--fg-3))]',
    'flex flex-wrap items-center gap-1.5',
  ].join(' ');

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selected.join(';')} />
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
      >
        {selected.length === 0 ? (
          <span className="text-[rgb(var(--fg-3))]">{placeholder}</span>
        ) : (
          selected.map((v) => {
            const label = options.find((o) => o.value === v)?.label ?? v;
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--brand)/0.12)] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--brand))]"
              >
                {label}
                <X
                  size={12}
                  strokeWidth={2.5}
                  role="button"
                  aria-label={`Remove ${label}`}
                  className="cursor-pointer opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(v);
                  }}
                />
              </span>
            );
          })
        )}
        <ChevronDown
          size={16}
          strokeWidth={2}
          className="ml-auto text-[rgb(var(--fg-3))] shrink-0"
        />
      </button>
      {open && available.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKey}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1 shadow-xl"
        >
          {available.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={false}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
                i === highlight
                  ? 'bg-[rgb(var(--brand)/0.12)] text-[rgb(var(--brand))]'
                  : 'hover:bg-[rgb(var(--bg-sub))]'
              }`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => toggle(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
