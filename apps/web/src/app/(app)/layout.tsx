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
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, company, isAuthenticated, clearAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Authentication Guard: Redirect if not authenticated
  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <HardHat className="h-10 w-10 animate-bounce text-amber-500" />
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading BuildTrack...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: Building2 },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/daily-reports', label: 'Daily Logs', icon: FileText },
    { href: '/materials', label: 'Materials', icon: Package },
    { href: '/expenses', label: 'Expenses', icon: Landmark },
    { href: '/finance', label: 'Finance Hub', icon: Wallet },
    { href: '/subcontractors', label: 'Subcontractors', icon: HardHat },
    { href: '/workers', label: 'Workers & Attendance', icon: Users },
    { href: '/reports', label: 'Reports', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 m-4 mr-0 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 backdrop-blur-md shadow-premium">
        {/* Workspace Selector */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-200/40 dark:border-zinc-800/40">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500 text-white shadow-[0_2px_10px_rgba(249,115,22,0.2)]">
            <HardHat className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-white leading-tight">BuildTrack</span>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wider uppercase leading-none">v3.0 Enterprise</span>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <span className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}>
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300'
                  }`} />
                  {item.label}
                  {isActive && (
                    <span className="absolute left-1 top-1/4 bottom-1/4 w-0.5 rounded-full bg-orange-500" />
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        {/* User Footer settings & Switcher */}
        <div className="p-3 border-t border-zinc-200/40 dark:border-zinc-800/40 flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/25">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate uppercase font-medium">
                {user?.roleDisplayName}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-zinc-950/40 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-white">
                  <HardHat className="w-4 h-4" />
                </div>
                <span className="font-bold text-base tracking-tight">BuildTrack</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 font-semibold' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}>
                      <Icon className="w-4.5 h-4.5" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="w-4.5 h-4.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Command Header */}
        <header className="flex h-16 items-center justify-between px-8 bg-transparent border-b border-zinc-200/40 dark:border-zinc-800/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-zinc-500" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:flex flex-col text-left">
              <h2 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                {company?.name || 'Enterprise'}
              </h2>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                SaaS Dashboard Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Button with Short-cut label */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Quick search...</span>
              <kbd className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">⌘K</kbd>
            </div>

            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
            </Button>
          </div>
        </header>

        {/* Core Body Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/25">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
