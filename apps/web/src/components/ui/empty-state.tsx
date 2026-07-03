import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'compact' | 'table';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const isTable = variant === 'table';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center select-none',
        isCompact ? 'py-8 px-4' : isTable ? 'py-12 px-4' : 'py-16 px-6',
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl bg-accent/50 border border-border/20 text-muted-foreground/40 mb-4',
            isCompact ? 'w-10 h-10' : 'w-14 h-14'
          )}
          aria-hidden="true"
        >
          <span className={cn(isCompact ? '[&>svg]:w-5 [&>svg]:h-5' : '[&>svg]:w-7 [&>svg]:h-7')}>
            {icon}
          </span>
        </div>
      )}

      <p
        className={cn(
          'font-semibold text-foreground/65',
          isCompact ? 'text-[13px]' : 'text-[15px]'
        )}
      >
        {title}
      </p>

      {description && (
        <p
          className={cn(
            'text-muted-foreground/55 mt-1.5 max-w-sm leading-relaxed',
            isCompact ? 'text-[12px]' : 'text-[13px]'
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}

// ── Preset empty states ────────────────────────────────────────

export function EmptyProjects({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
      title="No projects yet"
      description="Create your first construction project to start tracking budgets, tasks, and team progress."
      action={
        onCreateClick ? (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-primary text-primary-foreground rounded-xl hover:brightness-105 transition-all shadow-surface"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            New Project
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptyTasks({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
      title="No tasks found"
      description="Tasks will appear here once created. Add tasks to projects to track your team's work."
      action={
        onCreateClick ? (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-primary text-primary-foreground rounded-xl hover:brightness-105 transition-all shadow-surface"
          >
            Add Task
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      variant="compact"
      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
      title="No activity yet"
      description="Site events and team actions will appear here in real time."
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      variant="table"
      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
      title={`No results for "${query}"`}
      description="Try adjusting your search or filters to find what you're looking for."
    />
  );
}

export function EmptyExpenses({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
      title="No expenses logged"
      description="Expense vouchers submitted by your team will appear here for review and approval."
      action={
        onCreateClick ? (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-primary text-primary-foreground rounded-xl hover:brightness-105 transition-all shadow-surface"
          >
            Log Expense
          </button>
        ) : undefined
      }
    />
  );
}
