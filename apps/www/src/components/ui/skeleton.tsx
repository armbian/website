export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[rgb(var(--bg-sub))] rounded ${className}`} />;
}

export function BoardCardSkeleton() {
  return (
    <div className="hw-card rounded-2xl p-4 animate-pulse">
      <div className="h-28 sm:h-32 bg-[rgb(var(--bg-sub))] rounded-xl mb-3" />
      <div className="border-t border-white/10 pt-3">
        <div className="h-2 w-16 bg-[rgb(var(--bg-sub))] rounded mb-2" />
        <div className="h-4 w-24 bg-[rgb(var(--bg-sub))] rounded" />
      </div>
    </div>
  );
}

export function BoardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <BoardCardSkeleton key={i} />
      ))}
    </div>
  );
}
