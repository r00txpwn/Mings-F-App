interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700/80 ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="cockpit-panel space-y-3 p-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="cockpit-panel overflow-hidden p-0" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="mx-4 my-3 h-8 w-full" />
      ))}
    </div>
  );
}
