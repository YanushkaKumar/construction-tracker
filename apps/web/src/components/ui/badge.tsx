import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border font-mono text-[10px] font-bold tracking-widest uppercase select-none whitespace-nowrap transition-colors duration-200',
  {
    variants: {
      variant: {
        default:   'bg-accent/60 border-border/30 text-foreground/75',
        outline:   'bg-transparent border-border/50 text-muted-foreground',
        success:   'bg-success-subtle border-success text-success',
        warning:   'bg-warning-subtle border-warning text-warning',
        danger:    'bg-danger-subtle border-danger text-danger',
        info:      'bg-info-subtle border-info text-info',
        primary:   'bg-primary/10 border-primary/30 text-primary',
        planning:  'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400',
        active:    'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400',
        paused:    'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400',
        critical:  'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400',
        complete:  'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400',
      },
      size: {
        default: 'px-2 py-0.5 text-[10px]',
        sm:      'px-1.5 py-0.5 text-[9px]',
        lg:      'px-2.5 py-1 text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
            'bg-current': true,
          })}
        />
      )}
      {children}
    </span>
  );
}

// ── Status Badge helper ──────────────────────────────────────
const STATUS_VARIANT_MAP: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
  PLANNING:    'planning',
  IN_PROGRESS: 'active',
  ON_HOLD:     'paused',
  COMPLETED:   'complete',
  CANCELLED:   'critical',
  BLOCKED:     'critical',
  UPCOMING:    'active',
  DONE:        'complete',
  IN_REVIEW:   'info',
  TODO:        'default',
  PENDING:     'warning',
  APPROVED:    'success',
  REJECTED:    'critical',
  PAID:        'success',
  ACTIVE:      'active',
  INACTIVE:    'complete',
  DRAFT:       'default',
  DISPUTED:    'critical',
  TERMINATED:  'complete',
  LOW:         'default',
  MEDIUM:      'info',
  HIGH:        'warning',
  URGENT:      'critical',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  PLANNING:    'Planning',
  IN_PROGRESS: 'Active',
  ON_HOLD:     'On Hold',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
  BLOCKED:     'Blocked',
  UPCOMING:    'Upcoming',
  DONE:        'Done',
  IN_REVIEW:   'In Review',
  TODO:        'To Do',
  PENDING:     'Pending',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
  PAID:        'Paid',
  ACTIVE:      'Active',
  INACTIVE:    'Inactive',
  DRAFT:       'Draft',
  DISPUTED:    'Disputed',
  TERMINATED:  'Terminated',
  LOW:         'Low',
  MEDIUM:      'Medium',
  HIGH:        'High',
  URGENT:      'Urgent',
};

function StatusBadge({ status, size }: { status: string; size?: VariantProps<typeof badgeVariants>['size'] }) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'default';
  const label = STATUS_LABEL_MAP[status] ?? status;
  return (
    <Badge variant={variant} size={size} dot>
      {label}
    </Badge>
  );
}

// ── Count Badge ────────────────────────────────────────────
function CountBadge({
  count,
  max = 99,
  className,
}: {
  count: number;
  max?: number;
  className?: string;
}) {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-none',
        className
      )}
    >
      {display}
    </span>
  );
}

export { Badge, badgeVariants, StatusBadge, CountBadge };
