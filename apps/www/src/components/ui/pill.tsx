'use client';

export function Pill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap ${
        active
          ? 'text-white'
          : 'text-[rgb(var(--fg-2))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-sub))]'
      }`}
      style={active ? { backgroundColor: color ?? 'rgb(var(--brand))' } : undefined}
    >
      {children}
    </button>
  );
}
