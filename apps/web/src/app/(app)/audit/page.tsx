'use client';

import React, { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  History, Search, ChevronDown, ChevronRight, ChevronLeft,
  Plus, Pencil, Trash2, Activity, RotateCcw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AuditField { field: string; value: unknown }

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  label: string | null;
  user: { id: string; name: string; email: string | null; role: string | null };
  fields: AuditField[];
  ipAddress: string | null;
  createdAt: string;
}

interface AuditResponse {
  data: AuditEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface FilterOptions {
  entityTypes: { value: string; count: number }[];
  actions: { value: string; count: number }[];
  users: { value: string; label: string; count: number }[];
}

const inputCls =
  'flex h-9 w-full rounded-xl border border-border/40 bg-accent/20 px-3 py-1.5 text-[13px] outline-none focus:border-foreground/30 focus:ring-2 focus:ring-ring/20 font-medium transition-all';

/** Plain words for the verbs the trail stores. */
const ACTION_TEXT: Record<string, string> = {
  CREATE: 'Added',
  UPDATE: 'Changed',
  DELETE: 'Deleted',
  UPDATE_PROCUREMENT_STAGE: 'Moved stage',
  PROCESS_PAYMENT: 'Paid',
  FUND_SOURCE_CREATED: 'Added funding',
};

function actionText(action: string) {
  return ACTION_TEXT[action] ?? action.replace(/_/g, ' ').toLowerCase();
}

function actionStyle(action: string): { variant: any; Icon: React.ElementType } {
  if (action === 'CREATE' || action.includes('CREATED')) return { variant: 'success', Icon: Plus };
  if (action === 'DELETE') return { variant: 'danger', Icon: Trash2 };
  if (action === 'UPDATE') return { variant: 'info', Icon: Pencil };
  return { variant: 'default', Icon: Activity };
}

/** "Funding source", not "FundingSource". */
function entityText(entityType: string) {
  const spaced = entityType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function fieldText(field: string) {
  const spaced = field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') {
    // An ISO timestamp reads as a date; anything else stays as typed.
    if (/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(value)) {
      return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    }
    return value;
  }
  return JSON.stringify(value);
}

function whenText(iso: string) {
  const at = new Date(iso);
  return {
    date: at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    relative: relativeText(at),
  };
}

function relativeText(at: Date) {
  const seconds = Math.floor((Date.now() - at.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} d ago`;
  return '';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

/** The instant a local calendar day starts or ends, as a UTC timestamp. */
function dayBoundary(day: string, edge: 'start' | 'end'): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return edge === 'start'
    ? new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
    : new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

const EMPTY_FILTERS = { userId: '', entityType: '', action: '', from: '', to: '', search: '' };

export default function AuditPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const params = useMemo(() => {
    const query: Record<string, string> = { page: String(page), limit: '50' };
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      // A date picker gives a bare day. Send the instant that day begins and
      // ends *here*, so the range means the viewer's day rather than the
      // server's — otherwise Sri Lankan mornings fall outside their own date.
      if (key === 'from') query.from = dayBoundary(value, 'start');
      else if (key === 'to') query.to = dayBoundary(value, 'end');
      else query[key] = value;
    }
    return query;
  }, [filters, page]);

  const { data, isLoading, isFetching, error } = useQuery<AuditResponse>({
    queryKey: ['audit', params],
    queryFn: async () => (await apiClient.get('/audit', { params })).data,
    // Without this the table blanks to a skeleton on every page change.
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const { data: options } = useQuery<FilterOptions>({
    queryKey: ['audit', 'filters'],
    queryFn: async () => (await apiClient.get('/audit/filters')).data,
    retry: 1,
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = Object.values(filters).some(Boolean);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setSearchDraft('');
    setPage(1);
  };

  return (
    <div className="space-y-5 pb-12" aria-label="Activity log">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="text-left select-none">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground/90">
            Activity Log
          </h1>
          <p className="text-[13px] text-muted-foreground/65 mt-0.5 font-medium">
            Who added or changed something, what it was, and when.
          </p>
        </div>
        {meta && (
          <p className="text-[12px] text-muted-foreground/60 font-medium flex-shrink-0">
            {meta.total.toLocaleString()} {meta.total === 1 ? 'entry' : 'entries'}
            {isFetching && <span className="ml-2 opacity-60">updating…</span>}
          </p>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground/70">Search</Label>
            <form
              onSubmit={(e) => { e.preventDefault(); setFilter('search', searchDraft.trim()); }}
              className="relative mt-1"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" aria-hidden />
              <input
                className={cn(inputCls, 'pl-9')}
                placeholder="Name, person, or record…"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                aria-label="Search the activity log"
              />
            </form>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground/70">Person</Label>
            <select
              className={cn(inputCls, 'mt-1')}
              value={filters.userId}
              onChange={(e) => setFilter('userId', e.target.value)}
              aria-label="Filter by person"
            >
              <option value="">Everyone</option>
              {options?.users.map((u) => (
                <option key={u.value} value={u.value}>{u.label} ({u.count})</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground/70">Record type</Label>
            <select
              className={cn(inputCls, 'mt-1')}
              value={filters.entityType}
              onChange={(e) => setFilter('entityType', e.target.value)}
              aria-label="Filter by record type"
            >
              <option value="">All records</option>
              {options?.entityTypes.map((t) => (
                <option key={t.value} value={t.value}>{entityText(t.value)} ({t.count})</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground/70">Action</Label>
            <select
              className={cn(inputCls, 'mt-1')}
              value={filters.action}
              onChange={(e) => setFilter('action', e.target.value)}
              aria-label="Filter by action"
            >
              <option value="">All actions</option>
              {options?.actions.map((a) => (
                <option key={a.value} value={a.value}>{actionText(a.value)} ({a.count})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground/70">From</Label>
              <input
                type="date" className={cn(inputCls, 'mt-1')}
                value={filters.from}
                onChange={(e) => setFilter('from', e.target.value)}
                aria-label="From date"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground/70">To</Label>
              <input
                type="date" className={cn(inputCls, 'mt-1')}
                value={filters.to}
                onChange={(e) => setFilter('to', e.target.value)}
                aria-label="To date"
              />
            </div>
          </div>

          {hasFilters && (
            <div className="lg:col-span-6 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-[12px]">
                <RotateCcw className="w-3 h-3" aria-hidden /> Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Entries ───────────────────────────────────────── */}
      {error ? (
        <EmptyState
          icon={<History className="w-6 h-6" aria-hidden />}
          title="The activity log could not be loaded"
          description="Only a company owner can view this page. If that is you, try reloading."
        />
      ) : isLoading ? (
        <SkeletonList />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6" aria-hidden />}
          title={hasFilters ? 'Nothing matches these filters' : 'No activity recorded yet'}
          description={
            hasFilters
              ? 'Try widening the date range or clearing the filters.'
              : 'Once someone adds or changes a record, it will appear here.'
          }
          action={hasFilters ? <Button variant="outline" size="sm" onClick={clearAll}>Clear filters</Button> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border/20">
            {entries.map((entry) => {
              const { variant, Icon } = actionStyle(entry.action);
              const when = whenText(entry.createdAt);
              const isOpen = expanded.has(entry.id);
              const canExpand = entry.fields.length > 0;

              return (
                <div key={entry.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {/* Who */}
                    <div
                      className="w-8 h-8 flex-shrink-0 rounded-full bg-accent/60 border border-border/30 grid place-items-center text-[11px] font-bold text-foreground/70"
                      title={entry.user.email ?? entry.user.name}
                      aria-hidden
                    >
                      {initials(entry.user.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[13px] font-semibold text-foreground/90">
                          {entry.user.name}
                        </span>
                        {entry.user.role && (
                          <Badge variant="outline" size="sm">{entry.user.role.replace(/_/g, ' ')}</Badge>
                        )}
                        <Badge variant={variant} size="sm" className="gap-1">
                          <Icon className="w-2.5 h-2.5" aria-hidden />
                          {actionText(entry.action)}
                        </Badge>
                        <span className="text-[13px] text-muted-foreground/80">
                          {entityText(entry.entityType)}
                        </span>
                        {entry.label && (
                          <span className="text-[13px] font-medium text-foreground/80 truncate max-w-[22rem]">
                            “{entry.label}”
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground/60 font-medium">
                        <span>{when.date}</span>
                        <span aria-hidden>·</span>
                        <span>{when.time}</span>
                        {when.relative && (<><span aria-hidden>·</span><span>{when.relative}</span></>)}
                        {canExpand && (
                          <button
                            type="button"
                            onClick={() => toggle(entry.id)}
                            className="inline-flex items-center gap-0.5 text-foreground/60 hover:text-foreground transition-colors"
                            aria-expanded={isOpen}
                          >
                            {isOpen
                              ? <ChevronDown className="w-3 h-3" aria-hidden />
                              : <ChevronRight className="w-3 h-3" aria-hidden />}
                            {isOpen ? 'Hide' : `${entry.fields.length} ${entry.fields.length === 1 ? 'detail' : 'details'}`}
                          </button>
                        )}
                      </div>

                      {isOpen && (
                        <dl className="mt-2.5 grid gap-1.5 sm:grid-cols-2 rounded-xl bg-accent/20 border border-border/25 p-3">
                          {entry.fields.map((f) => (
                            <div key={f.field} className="flex gap-2 min-w-0">
                              <dt className="text-[11px] text-muted-foreground/70 font-medium flex-shrink-0">
                                {fieldText(f.field)}:
                              </dt>
                              <dd className="text-[11px] text-foreground/85 font-medium break-words min-w-0">
                                {valueText(f.value)}
                              </dd>
                            </div>
                          ))}
                          <div className="sm:col-span-2 pt-1 mt-0.5 border-t border-border/20 text-[10px] text-muted-foreground/50 font-mono">
                            {entry.entityId}
                            {entry.ipAddress && ` · from ${entry.ipAddress}`}
                          </div>
                        </dl>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Pagination ────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground/60 font-medium">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" className="gap-1"
              disabled={meta.page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden /> Previous
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1"
              disabled={meta.page >= meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
