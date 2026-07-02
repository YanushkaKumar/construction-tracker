'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HardHat, 
  LayoutDashboard, 
  Building2, 
  CheckSquare, 
  FileText, 
  Package, 
  Landmark, 
  Wallet,
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell, 
  User,
  BarChart2,
  Search,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, company, isAuthenticated, clearAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchFocused(f => !f);
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-foreground/40 animate-pulse-soft" />
          </div>
          <span className="text-caption">Loading BuildTrack…</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/projects', label: 'Projects', icon: Building2 },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/daily-reports', label: 'Daily Logs', icon: FileText },
        { href: '/workers', label: 'Workforce', icon: Users },
        { href: '/materials', label: 'Materials', icon: Package },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/expenses', label: 'Expenses', icon: Landmark },
        { href: '/finance', label: 'Treasury', icon: Wallet },
        { href: '/subcontractors', label: 'Contracts', icon: HardHat },
      ],
    },
    {
      label: 'System',
      items: [
        { href: '/reports', label: 'Reports', icon: BarChart2 },
        { href: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // Flatten for mobile
  const allNavItems = navGroups.flatMap(g => g.items);

  // Mobile bottom bar items (5 primary)
  const mobileBottomItems = [
    allNavItems.find(i => i.href === '/dashboard')!,
    allNavItems.find(i => i.href === '/projects')!,
    allNavItems.find(i => i.href === '/tasks')!,
    allNavItems.find(i => i.href === '/finance')!,
  ];

  const getPageTitle = () => {
    const item = allNavItems.find(i => pathname === i.href || pathname.startsWith(i.href + '/'));
    return item?.label || 'BuildTrack';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ═══ Desktop Sidebar — Collapsible Icon Rail ═══ */}
      <aside
        className="hidden lg:flex lg:flex-col flex-shrink-0 border-r border-border/50 bg-card/50 transition-all duration-300 ease-out relative z-20"
        style={{ width: sidebarExpanded ? 220 : 64 }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-border/40">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background flex-shrink-0">
            <HardHat className="w-4 h-4" />
          </div>
          <div
            className="ml-3 flex flex-col overflow-hidden transition-all duration-300"
            style={{ opacity: sidebarExpanded ? 1 : 0, width: sidebarExpanded ? 'auto' : 0 }}
          >
            <span className="text-sm font-semibold text-foreground tracking-tight whitespace-nowrap leading-tight">BuildTrack</span>
            <span className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase whitespace-nowrap">Enterprise</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Group label — only visible when expanded */}
              <div
                className="px-2 mb-1 transition-all duration-300 overflow-hidden"
                style={{ opacity: sidebarExpanded ? 1 : 0, height: sidebarExpanded ? 'auto' : 0 }}
              >
                <span className="text-label text-muted-foreground/50 text-[9px]">{group.label}</span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link key={item.href} href={item.href}>
                      <span
                        className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                          sidebarExpanded ? 'px-2.5 py-2' : 'px-0 py-2 justify-center'
                        } ${
                          isActive
                            ? 'bg-accent text-foreground'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <span className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-full bg-foreground" />
                        )}
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-foreground' : 'text-muted-foreground/60 group-hover:text-foreground/70'
                        }`} />
                        <span
                          className={`text-[13px] font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                            isActive ? 'font-semibold' : ''
                          }`}
                          style={{ opacity: sidebarExpanded ? 1 : 0, width: sidebarExpanded ? 'auto' : 0 }}
                        >
                          {item.label}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div className="border-t border-border/40 p-2">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-all cursor-pointer ${
              sidebarExpanded ? '' : 'justify-center'
            }`}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-foreground/60 flex-shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div
              className="flex flex-col overflow-hidden transition-all duration-300"
              style={{ opacity: sidebarExpanded ? 1 : 0, width: sidebarExpanded ? 'auto' : 0 }}
            >
              <span className="text-xs font-semibold text-foreground truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[9px] text-muted-foreground truncate uppercase font-medium">
                {user?.roleDisplayName}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-2.5 p-2 rounded-lg text-xs font-medium text-destructive/80 hover:bg-destructive/5 transition-colors ${
              sidebarExpanded ? '' : 'justify-center'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span
              className="transition-all duration-300 overflow-hidden whitespace-nowrap"
              style={{ opacity: sidebarExpanded ? 1 : 0, width: sidebarExpanded ? 'auto' : 0 }}
            >
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Bottom Sheet Nav ═══ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-elevated border-t border-border/50 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <span className="text-title text-foreground">Navigation</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 space-y-1">
              {navGroups.map(group => (
                <div key={group.label}>
                  <p className="text-label text-muted-foreground/50 px-3 pt-3 pb-1 text-[9px]">{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                        <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-accent text-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}>
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border/40">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/5"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Main Content Area ═══ */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between px-4 md:px-6 bg-card/50 border-b border-border/40 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-4.5 h-4.5" />
            </Button>
            <div className="flex flex-col text-left">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {getPageTitle()}
              </h2>
              <span className="text-[10px] text-muted-foreground/60 font-medium hidden md:block">
                {company?.name || 'Enterprise'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                searchFocused
                  ? 'border-foreground/20 bg-card ring-2 ring-ring/20 w-72'
                  : 'border-border/50 bg-accent/30 hover:bg-accent/50 w-48'
              }`}
              onClick={() => setSearchFocused(true)}
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              {searchFocused ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
                  placeholder="Search projects, tasks, workers…"
                  onBlur={() => setSearchFocused(false)}
                />
              ) : (
                <span className="text-xs text-muted-foreground/50">Search…</span>
              )}
              <kbd className="text-[9px] bg-accent text-muted-foreground/50 px-1.5 py-0.5 rounded font-mono flex-shrink-0">⌘K</kbd>
            </div>

            <span className="h-4 w-px bg-border/50 hidden md:block" />

            {/* Notifications */}
            <Link href="/notifications">
              <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <div className="lg:hidden flex items-center justify-around h-14 bg-card/90 backdrop-blur-md border-t border-border/40 flex-shrink-0">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                <span className={`text-[9px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground/40'}`}>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1"
          >
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/50" />
            <span className="text-[9px] font-medium text-muted-foreground/40">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
