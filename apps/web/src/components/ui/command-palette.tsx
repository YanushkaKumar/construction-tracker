'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  LayoutDashboard, Building2, CheckSquare, FileText,
  Package, Landmark, Wallet, Users, Settings, BarChart2,
  HardHat, Search, ArrowRight, Hash, Sparkles, Plus,
  Command, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  group: string;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

// ── Static command registry ───────────────────────────────────

const NAV_COMMANDS: CommandItem[] = [
  { id: 'nav-dashboard',       label: 'Dashboard',       description: 'Executive command center', href: '/dashboard',      icon: <LayoutDashboard className="w-4 h-4" aria-hidden />,  group: 'Navigation', keywords: ['home', 'overview'] },
  { id: 'nav-projects',        label: 'Projects',        description: 'All active projects',      href: '/projects',       icon: <Building2 className="w-4 h-4" aria-hidden />,         group: 'Navigation', keywords: ['project', 'site'] },
  { id: 'nav-tasks',           label: 'Tasks',           description: 'Task management board',   href: '/tasks',          icon: <CheckSquare className="w-4 h-4" aria-hidden />,        group: 'Navigation', keywords: ['task', 'kanban', 'todo'] },
  { id: 'nav-daily-reports',   label: 'Daily Logs',      description: 'Site progress reports',   href: '/daily-reports',  icon: <FileText className="w-4 h-4" aria-hidden />,           group: 'Navigation', keywords: ['report', 'log', 'daily'] },
  { id: 'nav-workers',         label: 'Workforce',       description: 'Workers & attendance',    href: '/workers',        icon: <Users className="w-4 h-4" aria-hidden />,              group: 'Navigation', keywords: ['worker', 'labour', 'attendance', 'payroll'] },
  { id: 'nav-materials',       label: 'Materials',       description: 'Inventory & requisitions',href: '/materials',      icon: <Package className="w-4 h-4" aria-hidden />,            group: 'Navigation', keywords: ['material', 'inventory', 'stock'] },
  { id: 'nav-expenses',        label: 'Expenses',        description: 'Expense management',      href: '/expenses',       icon: <Landmark className="w-4 h-4" aria-hidden />,           group: 'Navigation', keywords: ['expense', 'voucher', 'approval'] },
  { id: 'nav-finance',         label: 'Treasury',        description: 'Finance & cash flow',     href: '/finance',        icon: <Wallet className="w-4 h-4" aria-hidden />,             group: 'Navigation', keywords: ['finance', 'treasury', 'advance', 'ledger'] },
  { id: 'nav-subcontractors',  label: 'Contracts',       description: 'Subcontractor management',href: '/subcontractors', icon: <HardHat className="w-4 h-4" aria-hidden />,            group: 'Navigation', keywords: ['subcontractor', 'contract', 'payment'] },
  { id: 'nav-reports',         label: 'Reports',         description: 'Analytics & insights',    href: '/reports',        icon: <BarChart2 className="w-4 h-4" aria-hidden />,          group: 'Navigation', keywords: ['report', 'analytics', 'chart'] },
  { id: 'nav-settings',        label: 'Settings',        description: 'Company & preferences',   href: '/settings',       icon: <Settings className="w-4 h-4" aria-hidden />,           group: 'Navigation', keywords: ['setting', 'profile', 'company', 'team'] },
];

const QUICK_ACTIONS: CommandItem[] = [
  { id: 'action-new-project',  label: 'New Project',     description: 'Create a new construction project', href: '/projects',   icon: <Plus className="w-4 h-4" aria-hidden />,          group: 'Quick Actions', keywords: ['create', 'new', 'project'] },
  { id: 'action-new-task',     label: 'New Task',        description: 'Add task to a project',              href: '/tasks',      icon: <Plus className="w-4 h-4" aria-hidden />,          group: 'Quick Actions', keywords: ['create', 'new', 'task'] },
  { id: 'action-new-expense',  label: 'Log Expense',     description: 'Submit expense voucher',             href: '/expenses',   icon: <Plus className="w-4 h-4" aria-hidden />,          group: 'Quick Actions', keywords: ['create', 'expense', 'voucher'] },
  { id: 'action-daily-report', label: 'Daily Report',    description: 'Submit today\'s site report',        href: '/daily-reports', icon: <FileText className="w-4 h-4" aria-hidden />, group: 'Quick Actions', keywords: ['submit', 'log', 'daily'] },
];

const ALL_COMMANDS = [...QUICK_ACTIONS, ...NAV_COMMANDS];

function matchScore(item: CommandItem, query: string): number {
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  const desc = (item.description ?? '').toLowerCase();
  const kw = (item.keywords ?? []).join(' ').toLowerCase();

  if (label === q) return 100;
  if (label.startsWith(q)) return 90;
  if (label.includes(q)) return 70;
  if (desc.includes(q)) return 50;
  if (kw.includes(q)) return 40;
  return 0;
}

// ── Component ─────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter & rank
  const results = React.useMemo<CommandItem[]>(() => {
    if (!query.trim()) return ALL_COMMANDS;
    return ALL_COMMANDS
      .map(item => ({ item, score: matchScore(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [query]);

  // Group results
  const groups = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    results.forEach(item => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return map;
  }, [results]);

  // Flatten for keyboard nav
  const flat = React.useMemo(() => results, [results]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-active="true"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const executeItem = useCallback((item: CommandItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
    onClose();
  }, [router, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && flat[activeIdx]) { executeItem(flat[activeIdx]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flat, activeIdx, executeItem, onClose]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="command-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="command-panel"
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/20 h-14">
          <Search className="w-4.5 h-4.5 text-muted-foreground/50 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Search pages, actions, and features…"
            className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/45 outline-none border-none"
            aria-label="Command search"
            aria-autocomplete="list"
            aria-controls="command-listbox"
            aria-activedescendant={flat[activeIdx] ? `cmd-${flat[activeIdx].id}` : undefined}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setActiveIdx(0); }}
              className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          )}
          <kbd className="text-[11px] bg-accent/60 border border-border/30 text-muted-foreground/60 px-1.5 py-0.5 rounded font-mono font-bold select-none">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-listbox"
          role="listbox"
          aria-label="Command results"
          className="overflow-y-auto max-h-[400px] scrollbar-thin py-2"
        >
          {flat.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-muted-foreground/50 font-medium">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            Array.from(groups.entries()).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 select-none">
                  {groupName}
                </div>
                {items.map(item => {
                  const idx = globalIdx++;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${item.id}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={cn(
                        'w-full flex items-center gap-3.5 px-4 py-2.5 text-left transition-colors duration-100',
                        isActive ? 'bg-primary/8 text-foreground' : 'text-foreground/80 hover:bg-accent/40'
                      )}
                    >
                      <span className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg border flex-shrink-0 transition-colors',
                        isActive
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-accent/50 border-border/20 text-muted-foreground/60'
                      )}>
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold leading-tight">{item.label}</span>
                        {item.description && (
                          <span className="block text-[11px] text-muted-foreground/60 mt-0.5 truncate">
                            {item.description}
                          </span>
                        )}
                      </span>
                      {item.shortcut && (
                        <kbd className="text-[10px] bg-accent/60 border border-border/30 text-muted-foreground/50 px-1.5 py-0.5 rounded font-mono font-bold select-none flex-shrink-0">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isActive && (
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/15 bg-accent/10">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/45 font-medium select-none">
            <span className="flex items-center gap-1">
              <kbd className="bg-accent/60 border border-border/30 px-1 rounded font-mono text-[10px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-accent/60 border border-border/30 px-1 rounded font-mono text-[10px]">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-accent/60 border border-border/30 px-1 rounded font-mono text-[10px]">ESC</kbd>
              close
            </span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/35 font-bold uppercase tracking-wider select-none">
            <Command className="w-3 h-3" aria-hidden />
            BuildTrack
          </span>
        </div>
      </div>
    </>
  );
}
