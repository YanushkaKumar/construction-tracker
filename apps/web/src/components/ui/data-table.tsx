'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown, Search, X,
  ChevronLeft, ChevronRight, Download, SlidersHorizontal,
  LayoutGrid, List, Check, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  sticky?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
  getValue?: (row: T) => string | number | null | undefined;
  hidden?: boolean;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  onSelectionChange?: (rows: T[]) => void;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive';
    onClick: (selectedRows: T[]) => void;
  }>;
  emptyState?: React.ReactNode;
  toolbar?: React.ReactNode;
  density?: 'compact' | 'comfortable' | 'spacious';
  className?: string;
  tableClassName?: string;
  exportable?: boolean;
  onExport?: () => void;
  caption?: string;
}

// ── Density map ───────────────────────────────────────────────

const DENSITY_PADDING = {
  compact:     'py-2 px-4',
  comfortable: 'py-3 px-4',
  spacious:    'py-4 px-5',
};

// ── Sort icon ─────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc')  return <ChevronUp className="w-3.5 h-3.5 text-primary" aria-hidden />;
  if (direction === 'desc') return <ChevronDown className="w-3.5 h-3.5 text-primary" aria-hidden />;
  return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" aria-hidden />;
}

// ── Export to CSV ─────────────────────────────────────────────

function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filename = 'export'
) {
  const visible = columns.filter(c => !c.hidden);
  const headers = visible.map(c => `"${c.header}"`).join(',');
  const rows = data.map(row =>
    visible.map(col => {
      const val = col.getValue
        ? col.getValue(row)
        : (row[col.key as keyof T] as unknown);
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  const content = `data:text/csv;charset=utf-8,${[headers, ...rows].join('\n')}`;
  const a = document.createElement('a');
  a.href = encodeURI(content);
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ── Main Component ─────────────────────────────────────────────

export function DataTable<T extends { [key: string]: unknown }>({
  data,
  columns,
  keyField,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  selectable = false,
  paginated = true,
  pageSize: initialPageSize = 15,
  pageSizeOptions = [10, 15, 25, 50],
  onRowClick,
  onSelectionChange,
  bulkActions = [],
  emptyState,
  toolbar,
  density = 'comfortable',
  className,
  tableClassName,
  exportable = false,
  onExport,
  caption,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentDensity, setCurrentDensity] = useState<'compact' | 'comfortable' | 'spacious'>(density);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleCols = useMemo(() => columns.filter(c => !c.hidden), [columns]);

  // Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(row =>
      visibleCols.some(col => {
        const val = col.getValue
          ? col.getValue(row)
          : (row[col.key as keyof T] as unknown);
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, query, visibleCols]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find(c => String(c.key) === sortKey);
    return [...filtered].sort((a, b) => {
      const av = col?.getValue ? col.getValue(a) : (a[sortKey as keyof T] as unknown);
      const bv = col?.getValue ? col.getValue(b) : (b[sortKey as keyof T] as unknown);
      const an = typeof av === 'number' ? av : String(av ?? '').toLowerCase();
      const bn = typeof bv === 'number' ? bv : String(bv ?? '').toLowerCase();
      if (an < bn) return sortDir === 'asc' ? -1 : 1;
      if (an > bn) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Paginate
  const totalPages = paginated ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const paged = paginated ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [query, sortKey]);

  // Sort handler
  const handleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev !== key) {
        setSortDir('asc');
        return key;
      }
      setSortDir(d => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      return key;
    });
  }, []);

  // Selection
  const getRowKey = useCallback(
    (row: T, i: number) => String(keyField ? row[keyField] : i),
    [keyField]
  );

  const selectedRows = useMemo(
    () => paged.filter((r, i) => selected.has(getRowKey(r, i))),
    [paged, selected, getRowKey]
  );

  const toggleAll = useCallback(() => {
    const allKeys = new Set(paged.map((r, i) => getRowKey(r, i)));
    const allSelected = [...allKeys].every(k => selected.has(k));
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); allKeys.forEach(k => next.delete(k)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); allKeys.forEach(k => next.add(k)); return next; });
    }
  }, [paged, selected, getRowKey]);

  const toggleRow = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    onSelectionChange?.(selected.size > 0 ? data.filter((r, i) => selected.has(getRowKey(r, i))) : []);
  }, [selected, data, getRowKey, onSelectionChange]);

  const allCurrentSelected = paged.length > 0 && paged.every((r, i) => selected.has(getRowKey(r, i)));
  const someSelected = selected.size > 0;

  const handleExport = useCallback(() => {
    if (onExport) { onExport(); return; }
    exportCSV(sorted, columns);
  }, [sorted, columns, onExport]);

  const padClass = DENSITY_PADDING[currentDensity];

  return (
    <div className={cn('flex flex-col gap-0 bg-card border border-border/30 rounded-2xl overflow-hidden shadow-surface', className)}>
      {/* ── Toolbar ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20 flex-wrap">
        {/* Search */}
        {searchable && (
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-9 pr-8 rounded-lg border border-border/30 bg-accent/20 text-[13px] text-foreground placeholder:text-muted-foreground/45 font-medium focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-foreground/30 transition-all"
              aria-label="Search table"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Custom toolbar slot */}
        {toolbar}

        <div className="flex items-center gap-2 ml-auto">
          {/* Density selector */}
          <div className="hidden md:flex items-center gap-1 bg-accent/40 rounded-lg p-1 border border-border/20">
            {(['compact', 'comfortable', 'spacious'] as const).map(d => (
              <button
                key={d}
                onClick={() => setCurrentDensity(d)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all capitalize',
                  currentDensity === d
                    ? 'bg-card shadow-surface text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={currentDensity === d}
                title={`${d} density`}
              >
                {d === 'compact' ? 'Compact' : d === 'comfortable' ? 'Default' : 'Spacious'}
              </button>
            ))}
          </div>

          {/* Export */}
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-[12px]"
              aria-label="Export data to CSV"
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Bulk action bar ──────────────────────────────── */}
      {selectable && someSelected && bulkActions.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/15 animate-slide-down">
          <span className="text-[13px] font-semibold text-foreground">
            {selected.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                className="h-7 gap-1.5 text-[12px]"
                onClick={() => action.onClick(selectedRows)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────── */}
      <div className="overflow-x-auto flex-1">
        <table
          className={cn('w-full border-collapse text-left', tableClassName)}
          aria-label={caption ?? 'Data table'}
        >
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead>
            <tr className="border-b border-border/20">
              {selectable && (
                <th className="px-4 py-3 w-10 bg-accent/20">
                  <input
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-border/50 accent-primary cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {visibleCols.map(col => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none bg-accent/20 group',
                    padClass,
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer hover:text-muted-foreground/80 transition-colors',
                    col.sticky && 'sticky left-0 z-10 shadow-[1px_0_0_0_var(--border)]'
                  )}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  aria-sort={
                    col.sortable && sortKey === String(col.key)
                      ? sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon direction={sortKey === String(col.key) ? sortDir : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <tr key={i} className="border-b border-border/10">
                  {selectable && <td className="px-4 py-3"><div className="h-4 w-4 rounded shimmer-bg bg-accent" /></td>}
                  {visibleCols.map(col => (
                    <td key={String(col.key)} className={padClass}>
                      <div
                        className="h-3.5 rounded shimmer-bg bg-accent"
                        style={{ width: `${50 + Math.random() * 50}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols.length + (selectable ? 1 : 0)}
                  className="py-16 text-center"
                >
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                      <Search className="w-8 h-8" aria-hidden />
                      <p className="text-[13px] font-medium">
                        {query ? `No results for "${query}"` : 'No data available'}
                      </p>
                      {query && (
                        <button
                          onClick={() => setQuery('')}
                          className="text-[12px] text-primary hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => {
                const key = getRowKey(row, (page - 1) * pageSize + i);
                const isSelected = selected.has(key);
                return (
                  <tr
                    key={key}
                    className={cn(
                      'border-b border-border/10 last:border-0 transition-colors duration-150',
                      isSelected && 'bg-primary/4',
                      !isSelected && 'hover:bg-accent/35',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                    role={onRowClick ? 'button' : undefined}
                  >
                    {selectable && (
                      <td
                        className="px-4"
                        onClick={e => { e.stopPropagation(); toggleRow(key); }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          className="w-4 h-4 rounded border-border/50 accent-primary cursor-pointer"
                          aria-label={`Select row ${i + 1}`}
                        />
                      </td>
                    )}
                    {visibleCols.map(col => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'text-[13px] text-foreground/80',
                          padClass,
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.sticky && 'sticky left-0 z-10 bg-card group-hover:bg-accent/35'
                        )}
                      >
                        {col.render
                          ? col.render(row, (page - 1) * pageSize + i)
                          : String(row[col.key as keyof T] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────── */}
      {paginated && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
            <span className="hidden sm:inline">
              {sorted.length === 0
                ? 'No results'
                : `${Math.min((page - 1) * pageSize + 1, sorted.length)}–${Math.min(page * pageSize, sorted.length)} of ${sorted.length}`}
            </span>
            {/* Page size selector */}
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="ml-2 h-7 px-2 rounded-lg border border-border/30 bg-accent/20 text-[12px] font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map(n => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'ghost'}
                  size="xs"
                  onClick={() => setPage(p)}
                  className="w-7 h-7 text-[12px]"
                  aria-label={`Page ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
