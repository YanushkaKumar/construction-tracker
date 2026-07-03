'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HardHat, LayoutDashboard, Building2, CheckSquare, FileText,
  Package, Landmark, Wallet, Users, Settings, LogOut, Menu, X,
  Bell, BarChart2, Search, ChevronDown, Sparkles, Check,
  Sun, Moon, Plus, ChevronRight, AlertTriangle, Info,
  CheckCircle2, XCircle, Clock, Pin, PinOff, HardHatIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { CountBadge } from '@/components/ui/badge';
import { CommandPalette } from '@/components/ui/command-palette';
import { ToastProvider } from '@/components/ui/toast';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string;
}

// ── Role-adaptive navigation ──────────────────────────────────

function getNavGroups(role: string): NavGroup[] {
  const ownerGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { href: '/dashboard',     label: 'Dashboard',  icon: LayoutDashboard },
        { href: '/projects',      label: 'Projects',   icon: Building2 },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/tasks',         label: 'Tasks',      icon: CheckSquare },
        { href: '/daily-reports', label: 'Daily Logs', icon: FileText },
        { href: '/workers',       label: 'Workforce',  icon: Users },
        { href: '/materials',     label: 'Materials',  icon: Package },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/expenses',      label: 'Expenses',   icon: Landmark },
        { href: '/finance',       label: 'Treasury',   icon: Wallet },
        { href: '/subcontractors',label: 'Contracts',  icon: HardHat },
      ],
    },
    {
      label: 'System',
      items: [
        { href: '/reports',       label: 'Reports',    icon: BarChart2 },
        { href: '/settings',      label: 'Settings',   icon: Settings },
      ],
    },
  ];

  if (role === 'PROJECT_MANAGER') {
    return [
      {
        label: 'My Work',
        items: [
          { href: '/dashboard',     label: 'Dashboard',  icon: LayoutDashboard },
          { href: '/projects',      label: 'Projects',   icon: Building2 },
          { href: '/tasks',         label: 'Tasks',      icon: CheckSquare },
        ],
      },
      {
        label: 'Operations',
        items: [
          { href: '/daily-reports', label: 'Daily Logs', icon: FileText },
          { href: '/workers',       label: 'Workforce',  icon: Users },
          { href: '/materials',     label: 'Materials',  icon: Package },
        ],
      },
      {
        label: 'Finance',
        items: [
          { href: '/expenses',      label: 'Expenses',   icon: Landmark },
          { href: '/subcontractors',label: 'Contracts',  icon: HardHat },
          { href: '/reports',       label: 'Reports',    icon: BarChart2 },
        ],
      },
    ];
  }

  if (role === 'SITE_ENGINEER') {
    return [
      {
        label: 'Today',
        items: [
          { href: '/dashboard',     label: 'Dashboard',  icon: LayoutDashboard },
          { href: '/daily-reports', label: 'Daily Logs', icon: FileText },
          { href: '/tasks',         label: 'Tasks',      icon: CheckSquare },
        ],
      },
      {
        label: 'Resources',
        items: [
          { href: '/materials',     label: 'Materials',  icon: Package },
          { href: '/workers',       label: 'Workforce',  icon: Users },
          { href: '/expenses',      label: 'Expenses',   icon: Landmark },
        ],
      },
    ];
  }

  // Default — show everything (COMPANY_OWNER, ACCOUNTANT, ADMIN)
  return ownerGroups;
}

// ── Dark mode hook ────────────────────────────────────────────

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('buildtrack-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ? stored === 'dark' : prefersDark;
    setIsDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('buildtrack-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggle };
}

// ── Notification type icon ────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4 flex-shrink-0';
  if (type === 'EXPENSE_APPROVED' || type === 'TASK_COMPLETED')
    return <CheckCircle2 className={cn(cls, 'text-success')} aria-hidden />;
  if (type === 'EXPENSE_REJECTED')
    return <XCircle className={cn(cls, 'text-danger')} aria-hidden />;
  if (type === 'TASK_ASSIGNED' || type === 'MATERIAL_REQUEST')
    return <Info className={cn(cls, 'text-info')} aria-hidden />;
  if (type.includes('OVERDUE') || type.includes('ALERT'))
    return <AlertTriangle className={cn(cls, 'text-warning')} aria-hidden />;
  return <Bell className={cn(cls, 'text-muted-foreground/60')} aria-hidden />;
}

// ── Main Layout ───────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, company, isAuthenticated, clearAuth } = useAuthStore();
  const { isDark, toggle: toggleDark } = useDarkMode();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load sidebar pinned state
  useEffect(() => {
    const pinned = localStorage.getItem('buildtrack-sidebar-pinned') === 'true';
    setSidebarPinned(pinned);
    setSidebarExpanded(pinned);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setNotifOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close notification drawer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Fetch notifications
  const { data: notifData } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data?.data ?? res.data ?? [];
    },
    enabled: isAuthenticated && isMounted,
    refetchInterval: 60_000,
    retry: false,
  });

  const notifications = notifData ?? [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  const toggleSidebarPin = useCallback(() => {
    setSidebarPinned(prev => {
      const next = !prev;
      localStorage.setItem('buildtrack-sidebar-pinned', String(next));
      setSidebarExpanded(next);
      return next;
    });
  }, []);

  const handleSidebarMouseEnter = useCallback(() => {
    if (!sidebarPinned) setSidebarExpanded(true);
  }, [sidebarPinned]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (!sidebarPinned) {
      setSidebarExpanded(false);
      setShowWorkspaceDropdown(false);
    }
  }, [sidebarPinned]);

  const role = user?.role ?? 'COMPANY_OWNER';
  const navGroups = getNavGroups(role);
  const allNavItems = navGroups.flatMap(g => g.items);

  const mobileBottomItems = [
    allNavItems.find(i => i.href === '/dashboard'),
    allNavItems.find(i => i.href === '/projects'),
    allNavItems.find(i => i.href === '/tasks'),
    allNavItems.find(i => i.href === '/finance') ?? allNavItems.find(i => i.href === '/expenses'),
  ].filter(Boolean) as NavItem[];

  // Breadcrumb logic
  const activeItem = allNavItems.find(i => pathname === i.href || pathname.startsWith(i.href + '/'));
  const activeGroup = navGroups.find(g => g.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/')));
  const breadcrumbs = {
    group: activeGroup?.label ?? 'Workspace',
    item: activeItem?.label ?? 'Overview',
    href: activeItem?.href,
  };

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3" aria-busy="true" aria-label="Loading BuildTrack">
          <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-border/20">
            <HardHat className="w-6 h-6 text-muted-foreground/40 animate-pulse-soft" aria-hidden />
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/50 font-mono">
            Loading BuildTrack…
          </span>
        </div>
      </div>
    );
  }

  const sidebarWidth = sidebarExpanded ? 240 : 68;

  return (
    <ToastProvider>
      {/* Skip to content */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {/* Command palette */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      <div className="flex h-screen overflow-hidden bg-background font-sans antialiased text-foreground">
        {/* Structural grid overlay */}
        <div
          className="absolute inset-0 structural-grid pointer-events-none -z-10"
          aria-hidden="true"
        />

        {/* ══ Desktop Sidebar ══════════════════════════════════ */}
        <aside
          className="hidden lg:flex lg:flex-col flex-shrink-0 border-r border-border/25 bg-card/50 backdrop-blur-xl transition-all duration-300 ease-in-out relative z-30 shadow-panel"
          style={{ width: sidebarWidth }}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
          aria-label="Main navigation"
        >
          {/* Workspace header */}
          <div className="relative border-b border-border/15 px-3.5 h-14 flex items-center">
            <div
              onClick={() => sidebarExpanded && setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className={cn(
                'flex items-center gap-2.5 w-full rounded-xl transition-all duration-200 cursor-pointer',
                sidebarExpanded ? 'p-1.5 hover:bg-accent/40' : 'p-0 justify-center'
              )}
              role={sidebarExpanded ? 'button' : undefined}
              aria-expanded={showWorkspaceDropdown}
              aria-haspopup={sidebarExpanded ? 'listbox' : undefined}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground flex-shrink-0 font-bold text-[14px] border border-primary/15 shadow-surface"
                aria-hidden="true"
              >
                {company?.name ? company.name.charAt(0).toUpperCase() : 'B'}
              </div>
              {sidebarExpanded && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-foreground/90 truncate leading-tight">
                    {company?.name ?? 'BuildTrack'}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5 font-mono">
                    Enterprise
                  </p>
                </div>
              )}
              {sidebarExpanded && (
                <ChevronDown
                  className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 transition-transform duration-200"
                  style={{ transform: showWorkspaceDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  aria-hidden
                />
              )}
            </div>

            {/* Workspace dropdown */}
            {showWorkspaceDropdown && sidebarExpanded && (
              <div
                className="absolute top-[58px] left-3.5 right-3.5 bg-card border border-border/30 rounded-xl shadow-elevated p-2 z-50 animate-scale-in"
                role="listbox"
                aria-label="Workspace selector"
              >
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-border/10 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest select-none">
                    Active workspace
                  </span>
                  <Sparkles className="w-3 h-3 text-warning" aria-hidden />
                </div>
                <button
                  role="option"
                  aria-selected="true"
                  className="flex items-center gap-2.5 w-full p-2.5 hover:bg-accent/40 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold text-[12px]" aria-hidden>
                    {company?.name ? company.name.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground/90 truncate">
                      {company?.name ?? 'BuildTrack'}
                    </p>
                    <p className="text-[9px] font-bold text-success uppercase tracking-widest mt-0.5 font-mono">
                      Active
                    </p>
                  </div>
                  <Check className="w-3.5 h-3.5 text-success flex-shrink-0" aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* Nav groups */}
          <div className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5 space-y-5" role="navigation">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-0.5">
                {/* Group label */}
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    opacity: sidebarExpanded ? 1 : 0,
                    height: sidebarExpanded ? 'auto' : 0,
                    marginBottom: sidebarExpanded ? '4px' : 0,
                  }}
                >
                  <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 select-none font-mono">
                    {group.label}
                  </span>
                </div>

                {/* Nav items */}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined}>
                      <span
                        className={cn(
                          'group flex items-center gap-3 rounded-xl transition-all duration-150 relative h-9',
                          sidebarExpanded ? 'px-3' : 'px-0 justify-center',
                          isActive
                            ? 'bg-foreground/[0.06] text-foreground font-semibold shadow-surface'
                            : 'text-muted-foreground/70 hover:bg-accent/50 hover:text-foreground'
                        )}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <span
                            className="absolute left-0.5 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        )}
                        <Icon
                          className={cn(
                            'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground/55 group-hover:text-foreground/80'
                          )}
                          aria-hidden="true"
                        />
                        {!sidebarExpanded && (
                          <span className="sr-only">{item.label}</span>
                        )}
                        <span
                          className={cn(
                            'text-[13.5px] whitespace-nowrap overflow-hidden transition-all duration-300',
                            sidebarExpanded
                              ? 'opacity-100 max-w-[160px]'
                              : 'opacity-0 max-w-0 pointer-events-none'
                          )}
                        >
                          {item.label}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-border/15 p-2.5 space-y-1.5">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className={cn(
                'flex w-full items-center gap-3 h-9 rounded-xl text-muted-foreground/70 hover:bg-accent/50 hover:text-foreground transition-colors',
                sidebarExpanded ? 'px-3' : 'justify-center px-0'
              )}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
            >
              {isDark
                ? <Sun className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
                : <Moon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
              }
              {sidebarExpanded && (
                <span className="text-[13.5px] whitespace-nowrap">
                  {isDark ? 'Light mode' : 'Dark mode'}
                </span>
              )}
            </button>

            {/* Pin sidebar (expanded only) */}
            {sidebarExpanded && (
              <button
                onClick={toggleSidebarPin}
                className="flex w-full items-center gap-3 h-9 px-3 rounded-xl text-muted-foreground/60 hover:bg-accent/50 hover:text-foreground transition-colors"
                aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              >
                {sidebarPinned
                  ? <PinOff className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
                  : <Pin className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
                }
                <span className="text-[13.5px] whitespace-nowrap">
                  {sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                </span>
              </button>
            )}

            {/* User profile */}
            <div
              className={cn(
                'flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-accent/40 transition-colors cursor-default',
                !sidebarExpanded && 'justify-center p-0'
              )}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent border border-border/25 text-foreground/75 font-bold text-[13px] shadow-surface"
                  aria-hidden="true"
                >
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-card"
                  aria-hidden="true"
                />
              </div>
              {sidebarExpanded && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-foreground/90 truncate leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground/55 font-bold uppercase tracking-widest mt-0.5 truncate font-mono">
                    {user?.roleDisplayName}
                  </p>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-3 h-9 rounded-xl text-[13px] font-semibold text-danger/75 hover:bg-danger-subtle hover:text-danger transition-colors',
                sidebarExpanded ? 'px-3' : 'justify-center px-0'
              )}
              aria-label="Sign out"
            >
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
              {sidebarExpanded && <span className="whitespace-nowrap">Sign out</span>}
            </button>
          </div>
        </aside>

        {/* ══ Mobile full-screen menu ═══════════════════════════ */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xl lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-modal border-t border-border/25 max-h-[88vh] overflow-y-auto scrollbar-thin animate-drawer-bottom lg:hidden"
              role="dialog"
              aria-label="Navigation menu"
              aria-modal="true"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-[14px]" aria-hidden>
                    {company?.name ? company.name.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground/90">{company?.name ?? 'BuildTrack'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest font-mono">Enterprise</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden />
                </Button>
              </div>

              <div className="p-4 space-y-5">
                {navGroups.map(group => (
                  <div key={group.label} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-3 py-1 select-none font-mono">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span className={cn(
                            'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-colors',
                            isActive
                              ? 'bg-foreground/[0.06] text-foreground shadow-surface'
                              : 'text-muted-foreground/70 hover:bg-accent/50 hover:text-foreground'
                          )}>
                            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border/15 space-y-2 bg-accent/10">
                <button
                  onClick={toggleDark}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold text-muted-foreground/70 hover:bg-accent/50 hover:text-foreground transition-colors"
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? <Sun className="w-5 h-5" aria-hidden /> : <Moon className="w-5 h-5" aria-hidden />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-bold text-danger/80 hover:bg-danger-subtle hover:text-danger transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" aria-hidden />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ Notification drawer ════════════════════════════════ */}
        {notifOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/30 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
              onClick={() => setNotifOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={notifRef}
              className="notification-drawer"
              role="dialog"
              aria-label="Notifications"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 flex-shrink-0">
                <div>
                  <h2 className="text-[15px] font-bold text-foreground/90">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-[12px] text-muted-foreground/60 mt-0.5 font-medium">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="xs" className="text-[11px]">
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-accent/50 border border-border/20 flex items-center justify-center mb-4" aria-hidden>
                      <Bell className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-[13px] font-semibold text-muted-foreground/60">No notifications</p>
                    <p className="text-[12px] text-muted-foreground/40 mt-1">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/10">
                    {notifications.slice(0, 20).map(n => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-5 py-4 transition-colors',
                          !n.isRead ? 'bg-primary/3' : 'hover:bg-accent/30'
                        )}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent/50 border border-border/20 flex-shrink-0 mt-0.5">
                          <NotifIcon type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground/90 leading-tight">{n.title}</p>
                          {n.message && (
                            <p className="text-[12px] text-muted-foreground/65 mt-0.5 leading-relaxed truncate-2">
                              {n.message}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground/40 mt-1.5 font-medium font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" aria-label="Unread" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-border/15 p-4">
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  View all notifications
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ══ Main content area ════════════════════════════════ */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Header */}
          <header
            className="flex h-14 items-center justify-between px-4 md:px-6 bg-card/50 border-b border-border/20 backdrop-blur-xl flex-shrink-0 z-20 shadow-panel"
            role="banner"
          >
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-5 h-5" aria-hidden />
              </Button>

              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-[14px] font-semibold select-none">
                  <li className="hidden sm:block text-muted-foreground/55">
                    {breadcrumbs.group}
                  </li>
                  <li className="hidden sm:block text-muted-foreground/30" aria-hidden>/</li>
                  <li>
                    {breadcrumbs.href ? (
                      <Link
                        href={breadcrumbs.href}
                        className="text-foreground/90 hover:text-foreground transition-colors"
                        aria-current="page"
                      >
                        {breadcrumbs.item}
                      </Link>
                    ) : (
                      <span className="text-foreground/90" aria-current="page">
                        {breadcrumbs.item}
                      </span>
                    )}
                  </li>
                </ol>
              </nav>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search / Command palette trigger */}
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-2.5 h-8 px-3 rounded-xl border border-border/30 bg-accent/25 hover:bg-accent/45 hover:border-border/50 transition-all duration-200 cursor-pointer group w-48"
                aria-label="Open command palette (⌘K)"
                aria-keyshortcuts="Meta+K"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground/45 flex-shrink-0 group-hover:text-muted-foreground/65" aria-hidden />
                <span className="text-[12.5px] text-muted-foreground/45 font-medium flex-1 text-left group-hover:text-muted-foreground/60">
                  Search…
                </span>
                <kbd className="text-[10px] bg-background/60 border border-border/25 text-muted-foreground/50 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 select-none">
                  ⌘K
                </kbd>
              </button>

              <span className="h-5 w-px bg-border/30 hidden md:block" aria-hidden />

              {/* Notifications bell */}
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative flex items-center justify-center w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
              >
                <Bell className="w-[18px] h-[18px]" aria-hidden />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-danger animate-pulse-soft" aria-hidden />
                )}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto scrollbar-thin"
            tabIndex={-1}
          >
            <div className="max-w-[1680px] w-full mx-auto px-4 md:px-6 py-5 md:py-7">
              {children}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <nav
            className="lg:hidden flex items-center h-16 bg-card/80 backdrop-blur-xl border-t border-border/20 flex-shrink-0 z-25 shadow-panel safe-area-inset-bottom"
            aria-label="Mobile navigation"
          >
            {mobileBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 min-h-[48px]"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-6 rounded-lg transition-colors',
                    isActive ? 'bg-foreground/[0.08]' : ''
                  )}>
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground/50'
                      )}
                      aria-hidden
                    />
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wide transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground/40'
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* More menu */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 min-h-[48px]"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="flex items-center justify-center w-8 h-6">
                <Menu className="w-5 h-5 text-muted-foreground/50" aria-hidden />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/40">More</span>
            </button>

            {/* Mobile FAB - search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="absolute right-4 bottom-20 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:brightness-105 transition-all active:scale-95"
              aria-label="Search (⌘K)"
            >
              <Search className="w-5 h-5" aria-hidden />
            </button>
          </nav>
        </div>
      </div>
    </ToastProvider>
  );
}
