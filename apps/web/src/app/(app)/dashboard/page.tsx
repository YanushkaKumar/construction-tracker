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
      {/* Header */}
      <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
              Ayubowan, {user?.firstName || 'User'} 👋
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2">
              Here is your company command center. Everything at a glance.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400">
            <HardHat className="w-4 h-4 text-amber-500" />
            {(user?.role || 'OWNER').replace('_', ' ')}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
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
              gradient="from-amber-500 to-orange-500"
            />
            <KpiCard
              label="Budget Utilization"
              value={`${kpis?.budgetUtilization || 0}%`}
              sub="Across all projects"
              icon={TrendingUp}
              gradient="from-emerald-500 to-teal-500"
              progress={kpis?.budgetUtilization}
            />
            <KpiCard
              label="Workers On Site"
              value={kpis?.workersOnSite?.toString() || '0'}
              sub="Active labour today"
              icon={Users}
              gradient="from-blue-500 to-indigo-500"
            />
            <KpiCard
              label="Pending Approvals"
              value={kpis?.pendingExpenses?.toString() || '0'}
              sub={kpis?.pendingExpenseAmount ? fmt(kpis.pendingExpenseAmount) : 'LKR 0'}
              icon={AlertCircle}
              gradient="from-rose-500 to-pink-500"
            />
          </div>

          {/* Financial Summary */}
          {finance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FinanceCard label="Total Budget" value={fmt(finance.totalBudget)} icon={BarChart2} color="text-zinc-500 dark:text-zinc-400" />
              <FinanceCard label="Advances In" value={fmt(finance.totalAdvance)} icon={ArrowDownCircle} color="text-emerald-550" />
              <FinanceCard label="Total Spent" value={fmt(finance.totalSpent)} icon={ArrowUpCircle} color="text-rose-550" />
              <FinanceCard label="Balance" value={fmt(finance.balance)} icon={Banknote} color={finance.balance >= 0 ? 'text-blue-550' : 'text-red-550'} />
            </div>
          )}

          {/* Quick Navigation + Project Status + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Navigation */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Quick Navigation</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {quickLinks.map(q => (
                    <Link key={q.href} href={q.href}>
                      <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group cursor-pointer">
                        <div className={`w-8.5 h-8.5 rounded-lg bg-gradient-to-br ${q.color} text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform duration-300`}>
                          <q.icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{q.label}</p>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">{q.desc}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Project Status Breakdown */}
              {statusBreakdown.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Projects by Status</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <DonutChart
                      data={statusBreakdown.map(s => {
                        const info = statusLabel[s.status] || { label: s.status, color: '#a1a1aa' };
                        return {
                          label: info.label,
                          value: s.count,
                          color: info.color
                        };
                      })}
                      subtitle="Total Projects"
                      isCurrency={false}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Expense Breakdown + Activity Log */}
            <div className="lg:col-span-8 space-y-6">
              {/* Expense Category Breakdown */}
              {expenseBreakdown.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Spending by Category</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <DonutChart
                      data={expenseBreakdown.map(c => {
                        const categoryColors: Record<string, string> = {
                          'MATERIAL': '#f59e0b',       // Amber
                          'LABOUR': '#3b82f6',         // Blue
                          'EQUIPMENT': '#10b981',      // Emerald
                          'PROJECT_MATERIAL': '#d97706',// Dark Amber
                          'SHARED_TOOL': '#8b5cf6',     // Purple
                          'DAILY_EXPENSE': '#f43f5e',   // Rose
                          'SERVICE': '#06b6d4',         // Cyan
                          'TRANSPORT': '#ec4899',       // Pink
                          'OTHER': '#6b7280',           // Grey
                        };
                        return {
                          label: c.category,
                          value: c.total,
                          color: categoryColors[c.category.toUpperCase()] || '#6b7280'
                        };
                      })}
                      subtitle="Total Spent"
                      isCurrency={true}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
                  <Link href="/settings" className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1">
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activities.length > 0 ? activities.slice(0, 8).map((a) => (
                    <div key={a.id} className="flex items-start gap-3 text-sm pb-3.5 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0">
                      <div className="w-8.5 h-8.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-extrabold text-xs flex-shrink-0">
                        {a.user?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal">
                          <span className="font-bold text-zinc-900 dark:text-white">{a.user}</span>{' '}
                          <span className="text-amber-600 font-bold">{a.action}</span>{' '}
                          on <span className="font-semibold">{a.entityType}</span>
                        </p>
                        <p className="text-xs font-medium text-zinc-400 mt-1">
                          {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) : (
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

function KpiCard({ label, value, sub, icon: Icon, gradient, progress }: {
  label: string; value: string; sub: string; icon: any; gradient: string; progress?: number;
}) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
          <div className={`w-8.5 h-8.5 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md shadow-zinc-900/5`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
        <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</p>
        {progress !== undefined && (
          <div className="h-1.5 mt-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-2.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

// Note: Tailwind v4 handles custom text colors or we can use normal utility classes.
function FinanceCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-base font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
