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
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 shadow-md">
            <HardHat className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">Build<span className="text-amber-500">Track</span></span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10 font-semibold' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-zinc-950/40 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-zinc-950">
                  <HardHat className="w-4 h-4" />
                </div>
                <span className="font-bold text-base tracking-tight">Build<span className="text-amber-500">Track</span></span>
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
                        ? 'bg-amber-500 text-zinc-950 font-semibold' 
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
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4.5 h-4.5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:flex flex-col">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {company?.name || 'My Company'}
              </h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                Construction Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
            </Button>

            <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Profile Menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  {user?.roleDisplayName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content Portal */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
