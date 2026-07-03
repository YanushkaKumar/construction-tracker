import { cn } from '@/lib/utils';

// ── Base Skeleton ─────────────────────────────────────────────
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg shimmer-bg bg-accent/50',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

// ── Skeleton Text Lines ────────────────────────────────────────
function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 && lines > 1 ? '72%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card border border-border/25 rounded-2xl p-5 shadow-surface space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
}

// ── Skeleton Stat Grid ────────────────────────────────────────
function SkeletonStatGrid({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: number;
}) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  }[cols] ?? 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid gap-4', gridClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Skeleton Table ─────────────────────────────────────────────
function SkeletonTable({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-card border border-border/25 rounded-2xl overflow-hidden shadow-surface',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/20 bg-accent/20">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-2.5"
            style={{ width: i === 0 ? '120px' : `${60 + Math.random() * 60}px`, flexShrink: 0 }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-5 py-3.5 border-b border-border/10 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3"
              style={{
                width: c === 0 ? '140px' : `${50 + Math.random() * 80}px`,
                flexShrink: 0,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Skeleton Chart ────────────────────────────────────────────
function SkeletonChart({
  height = 200,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn('bg-card border border-border/25 rounded-2xl p-5 shadow-surface', className)}>
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-44" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <Skeleton className={`w-full rounded-xl`} style={{ height }} />
    </div>
  );
}

// ── Skeleton List ─────────────────────────────────────────────
function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 py-2.5 border-b border-border/10 last:border-0">
          <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Skeleton Page Header ──────────────────────────────────────
function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border/25 pb-5">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <Skeleton className="h-9 w-32 rounded-xl" />
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatGrid,
  SkeletonTable,
  SkeletonChart,
  SkeletonList,
  SkeletonPageHeader,
};
