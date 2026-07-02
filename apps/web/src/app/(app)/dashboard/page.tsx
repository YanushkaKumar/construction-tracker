'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, Users, TrendingUp, AlertCircle, Plus, 
  ArrowUpRight, Loader2, CheckCircle2, HardHat,
  Wallet, CheckSquare, FileText, Package, Landmark,
  Clock, Activity, BarChart2, CircleDollarSign,
  Calendar, ArrowDownCircle, ArrowUpCircle, Banknote,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/custom-charts';
import Link from 'next/link';

interface DashboardData {
  kpis: {
    activeProjects: number;
    totalProjects: number;
    budgetUtilization: number;
    pendingExpenses: number;
    pendingExpenseAmount: number;
    workersOnSite: number;
  };
  charts: {
    projectsByStatus: Array<{ status: string; count: number }>;
    expenseByCategory: Array<{ category: string; total: number }>;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    user: string;
    createdAt: string;
  }>;
}

const fmt = (n: number) => {
  if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};

const statusLabel: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'Active', color: '#10b981' }, // Emerald
  PLANNING: { label: 'Planning', color: '#3b82f6' }, // Blue
  COMPLETED: { label: 'Done', color: '#a1a1aa' }, // Zinc
  ON_HOLD: { label: 'Paused', color: '#f59e0b' }, // Amber
  CANCELLED: { label: 'Cancelled', color: '#f43f5e' }, // Rose
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => (await apiClient.get('/dashboard')).data,
    retry: 1,
  });

  const { data: financeData } = useQuery<any>({
    queryKey: ['finance-overview'],
    queryFn: async () => (await apiClient.get('/finance/overview')).data,
    retry: 1,
  });

  const kpis = data?.kpis;
  const activities = data?.recentActivities || [];
  const statusBreakdown = data?.charts?.projectsByStatus || [];
  const expenseBreakdown = data?.charts?.expenseByCategory || [];
  const finance = financeData?.companyTotals;

  const quickLinks = [
    { href: '/projects', label: 'Projects', icon: Building2, color: 'from-amber-550 to-orange-500', desc: 'Manage sites' },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare, color: 'from-blue-550 to-indigo-500', desc: 'Track work' },
    { href: '/finance', label: 'Finance', icon: Wallet, color: 'from-emerald-550 to-teal-500', desc: 'Money flow' },
    { href: '/workers', label: 'Workers', icon: Users, color: 'from-violet-550 to-purple-550', desc: 'Attendance' },
    { href: '/subcontractors', label: 'Subcontractors', icon: HardHat, color: 'from-rose-550 to-pink-550', desc: 'Contracts' },
    { href: '/materials', label: 'Materials', icon: Package, color: 'from-cyan-550 to-blue-550', desc: 'Inventory' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
        <div className="text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Monitor project timelines, active budgets, and resource allocation across your operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] uppercase tracking-wider font-semibold text-orange-600 dark:text-orange-400 shadow-sm">
            <HardHat className="w-3.5 h-3.5" />
            {(user?.role || 'OWNER').replace('_', ' ')}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 shimmer-bg" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Active Projects"
              value={kpis?.activeProjects?.toString() || '0'}
              sub={`${kpis?.totalProjects || 0} total sites`}
              icon={Building2}
              iconColor="text-orange-500 bg-orange-500/10"
            />
            <KpiCard
              label="Budget Used"
              value={`${kpis?.budgetUtilization || 0}%`}
              sub="Aggregate budget usage"
              icon={TrendingUp}
              iconColor="text-emerald-500 bg-emerald-500/10"
              progress={kpis?.budgetUtilization}
            />
            <KpiCard
              label="Active Workers"
              value={kpis?.workersOnSite?.toString() || '0'}
              sub="Total labor on site today"
              icon={Users}
              iconColor="text-sky-500 bg-sky-500/10"
            />
            <KpiCard
              label="Pending Approvals"
              value={kpis?.pendingExpenses?.toString() || '0'}
              sub={kpis?.pendingExpenseAmount ? fmt(kpis.pendingExpenseAmount) : 'LKR 0 pending'}
              icon={AlertCircle}
              iconColor="text-rose-500 bg-rose-500/10"
            />
          </div>

          {/* Financial Summary */}
          {finance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FinanceCard label="Total Budgeted" value={fmt(finance.totalBudget)} icon={BarChart2} color="text-zinc-500 dark:text-zinc-400" />
              <FinanceCard label="Advances Received" value={fmt(finance.totalAdvance)} icon={ArrowDownCircle} color="text-emerald-600 dark:text-emerald-500" />
              <FinanceCard label="Total Disbursed" value={fmt(finance.totalSpent)} icon={ArrowUpCircle} color="text-rose-600 dark:text-rose-500" />
              <FinanceCard label="Treasury Balance" value={fmt(finance.balance)} icon={Banknote} color={finance.balance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-500'} />
            </div>
          )}

          {/* Core Analytics Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Quick Actions & Project Status */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="glass-panel">
                <CardHeader className="pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40">
                  <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Quick Navigation</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 pt-4">
                  {quickLinks.map(q => (
                    <Link key={q.href} href={q.href}>
                      <div className="p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/30 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group cursor-pointer shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2.5 transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
                          <q.icon className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{q.label}</p>
                        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{q.desc}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Project Status Breakdown */}
              {statusBreakdown.length > 0 && (
                <Card className="glass-panel">
                  <CardHeader className="pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40">
                    <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Projects Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <DonutChart
                      data={statusBreakdown.map(s => {
                        const info = statusLabel[s.status] || { label: s.status, color: '#a1a1aa' };
                        return {
                          label: info.label,
                          value: s.count,
                          color: info.color
                        };
                      })}
                      subtitle="Projects"
                      isCurrency={false}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Spending & Activity Feed */}
            <div className="lg:col-span-8 space-y-6">
              {/* Expense Category Breakdown */}
              {expenseBreakdown.length > 0 && (
                <Card className="glass-panel">
                  <CardHeader className="pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40">
                    <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Spending breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <DonutChart
                      data={expenseBreakdown.map(c => {
                        const categoryColors: Record<string, string> = {
                          'MATERIAL': '#f97316',       // Orange
                          'LABOUR': '#0284c7',         // Sky
                          'EQUIPMENT': '#10b981',      // Emerald
                          'PROJECT_MATERIAL': '#d97706',// Amber
                          'SHARED_TOOL': '#8b5cf6',     // Purple
                          'DAILY_EXPENSE': '#f43f5e',   // Rose
                          'SERVICE': '#06b6d4',         // Cyan
                          'TRANSPORT': '#ec4899',       // Pink
                          'OTHER': '#71717a',           // Zinc
                        };
                        return {
                          label: c.category,
                          value: c.total,
                          color: categoryColors[c.category.toUpperCase()] || '#71717a'
                        };
                      })}
                      subtitle="Total Spent"
                      isCurrency={true}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="glass-panel">
                <CardHeader className="pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">System Audit Feed</CardTitle>
                  <Link href="/settings" className="text-xs font-semibold text-orange-500 hover:text-orange-400 flex items-center gap-1">
                    Manage Audit <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="pt-6">
                  {activities.length > 0 ? (
                    <div className="relative border-l border-zinc-200/60 dark:border-zinc-800/80 ml-3.5 pl-6 space-y-6">
                      {activities.slice(0, 6).map((a) => (
                        <div key={a.id} className="relative group/item">
                          {/* Left bullet marker */}
                          <span className="absolute -left-[30px] top-1 flex items-center justify-center w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[8px] font-bold text-zinc-400 group-hover/item:border-orange-500 group-hover/item:text-orange-500 transition-colors">
                            {a.user?.charAt(0) || '?'}
                          </span>
                          <div className="text-left">
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal">
                              <span className="font-semibold text-zinc-900 dark:text-white">{a.user}</span>{' '}
                              <span className="text-orange-500 font-semibold lowercase">{a.action}</span>{' '}
                              on <span className="font-medium text-zinc-850 dark:text-zinc-200">{a.entityType}</span>
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                              {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(a.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-6">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────

function KpiCard({ label, value, sub, icon: Icon, iconColor, progress }: {
  label: string; value: string; sub: string; icon: any; iconColor: string; progress?: number;
}) {
  return (
    <Card className="glass-panel hover:-translate-y-0.5 transition-all duration-300">
      <CardContent className="p-5 text-left">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{value}</p>
        {progress !== undefined && (
          <div className="h-1 mt-3.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-2.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function FinanceCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/30 border border-zinc-200/40 dark:border-zinc-800/60 shadow-premium hover:-translate-y-0.5 transition-all duration-300 text-left">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
