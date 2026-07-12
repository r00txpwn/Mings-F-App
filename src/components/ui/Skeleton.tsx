import { Skeleton as ShadSkeleton } from '@/components/shadcn/skeleton';
import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <ShadSkeleton className={cn(className)} aria-hidden />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="space-y-3 p-4" aria-busy="true" aria-label="Loading">
      <ShadSkeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <ShadSkeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden p-0" aria-busy="true" aria-label="Loading">
      <ShadSkeleton className="h-10 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <ShadSkeleton key={i} className="mx-4 my-3 h-8 w-full" />
      ))}
    </Card>
  );
}
