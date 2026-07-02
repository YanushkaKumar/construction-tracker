'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, Users, TrendingUp, AlertCircle, 
  ArrowUpRight, Loader2, CheckCircle2, HardHat,
  Wallet, CheckSquare, FileText, Package, Landmark,
  Clock, Activity, BarChart2, CircleDollarSign,
  Calendar, ArrowDownCircle, ArrowUpCircle, Banknote,
  ChevronRight, AlertTriangle, Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart, ProgressBar } from '@/components/ui/custom-charts';
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

const statusLabel: Record<string, { label: string; color: string; dotClass: string }> = {
  IN_PROGRESS: { label: 'Active', color: 'oklch(0.65 0.18 145)', dotClass: 'status-active' },
  PLANNING: { label: 'Planning', color: 'oklch(0.60 0.14 250)', dotClass: 'status-planning' },
  COMPLETED: { label: 'Done', color: 'oklch(0.55 0 0)', dotClass: 'status-complete' },
  ON_HOLD: { label: 'Paused', color: 'oklch(0.75 0.15 65)', dotClass: 'status-paused' },
  CANCELLED: { label: 'Cancelled', color: 'oklch(0.60 0.22 25)', dotClass: 'status-critical' },
};

// Animated counter hook
function useCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

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

  // Animated numbers
  const activeCount = useCounter(kpis?.activeProjects || 0);
  const workerCount = useCounter(kpis?.workersOnSite || 0);
  const pendingCount = useCounter(kpis?.pendingExpenses || 0);

  const categoryColors: Record<string, string> = {
    'MATERIAL': 'oklch(0.72 0.14 55)',
    'LABOUR': 'oklch(0.62 0.12 250)',
    'EQUIPMENT': 'oklch(0.65 0.15 145)',
    'PROJECT_MATERIAL': 'oklch(0.70 0.13 60)',
    'SHARED_TOOL': 'oklch(0.60 0.16 310)',
    'DAILY_EXPENSE': 'oklch(0.65 0.18 25)',
    'SERVICE': 'oklch(0.68 0.10 200)',
    'TRANSPORT': 'oklch(0.62 0.14 340)',
    'OTHER': 'oklch(0.50 0.05 60)',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 stagger-children">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-caption mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-display text-foreground">
            Welcome back, {user?.firstName || 'User'}
          </h1>
        </div>
      </div>

      {/* ═══ Loading Skeletons ═══ */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card shadow-surface shimmer-bg" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* ═══ Hero Metrics — The CEO glance ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Active Projects"
              value={activeCount.toString()}
              caption={`${kpis?.totalProjects || 0} total`}
              icon={Building2}
            />
            <MetricCard
              label="Budget Utilized"
              value={`${kpis?.budgetUtilization || 0}%`}
              caption="Across all sites"
              icon={TrendingUp}
              progress={kpis?.budgetUtilization}
            />
            <MetricCard
              label="Workers Today"
              value={workerCount.toString()}
              caption="On-site labor"
              icon={Users}
            />
            <MetricCard
              label="Pending Approvals"
              value={pendingCount.toString()}
              caption={kpis?.pendingExpenseAmount ? fmt(kpis.pendingExpenseAmount) : 'LKR 0'}
              icon={AlertCircle}
              attention={pendingCount > 0}
            />
          </div>

          {/* ═══ Financial Pulse ═══ */}
          {finance && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-label text-muted-foreground/60">Financial Overview</h3>
                  <Link href="/finance" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    View Treasury <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <FinanceStat label="Total Budget" value={fmt(finance.totalBudget)} icon={BarChart2} />
                  <FinanceStat label="Received" value={fmt(finance.totalAdvance)} icon={ArrowDownCircle} positive />
                  <FinanceStat label="Spent" value={fmt(finance.totalSpent)} icon={ArrowUpCircle} />
                  <FinanceStat label="Balance" value={fmt(finance.balance)} icon={Banknote} positive={finance.balance >= 0} />
                </div>
                {/* Cash flow bar */}
                <div className="mt-5">
                  <ProgressBar
                    value={finance.totalSpent}
                    max={finance.totalAdvance || finance.totalBudget || 1}
                    label="Spend Rate"
                    showLabel
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ Main Grid ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left — Charts */}
            <div className="lg:col-span-5 space-y-6">
              {/* Project Status */}
              {statusBreakdown.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-label text-muted-foreground/60 mb-5">Project Status</h3>
                    <DonutChart
                      data={statusBreakdown.map(s => {
                        const info = statusLabel[s.status] || { label: s.status, color: 'oklch(0.55 0 0)' };
                        return { label: info.label, value: s.count, color: info.color };
                      })}
                      subtitle="Projects"
                      isCurrency={false}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Expense Breakdown */}
              {expenseBreakdown.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-label text-muted-foreground/60 mb-5">Spending Breakdown</h3>
                    <DonutChart
                      data={expenseBreakdown.map(c => ({
                        label: c.category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, ch => ch.toUpperCase()),
                        value: c.total,
                        color: categoryColors[c.category.toUpperCase()] || 'oklch(0.50 0.05 60)'
                      }))}
                      subtitle="Total Spent"
                      isCurrency={true}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right — Activity Feed */}
            <div className="lg:col-span-7">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-label text-muted-foreground/60">Recent Activity</h3>
                    <Link href="/settings" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      Audit Log <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {activities.length > 0 ? (
                    <div className="space-y-0">
                      {activities.slice(0, 8).map((a, idx) => (
                        <div
                          key={a.id}
                          className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0 group"
                        >
                          {/* User initial */}
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-foreground/50 text-[10px] font-semibold flex-shrink-0 mt-0.5 group-hover:bg-foreground/10 transition-colors">
                            {a.user?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              <span className="font-semibold text-foreground">{a.user}</span>{' '}
                              <span className="text-muted-foreground">{a.action}</span>{' '}
                              <span className="font-medium text-foreground/80">{a.entityType}</span>
                            </p>
                            <p className="text-caption mt-0.5">
                              {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' · '}
                              {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Activity className="w-8 h-8 text-muted-foreground/20 mb-3" />
                      <p className="text-caption">No recent activity</p>
                    </div>
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

function MetricCard({ label, value, caption, icon: Icon, progress, attention }: {
  label: string; value: string; caption: string; icon: any; progress?: number; attention?: boolean;
}) {
  return (
    <Card className={`transition-all duration-300 hover:shadow-panel ${attention ? 'ring-1 ring-destructive/20' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-label text-muted-foreground/60">{label}</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            attention ? 'bg-danger-subtle text-danger' : 'bg-accent text-muted-foreground/50'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-foreground tracking-tight text-financial animate-count-up">{value}</p>
        {progress !== undefined && (
          <div className="mt-3">
            <ProgressBar value={progress} height={4} />
          </div>
        )}
        <p className="text-caption mt-2">{caption}</p>
      </CardContent>
    </Card>
  );
}

function FinanceStat({ label, value, icon: Icon, positive }: {
  label: string; value: string; icon: any; positive?: boolean;
}) {
  return (
    <div className="text-left">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${positive ? 'text-success' : 'text-muted-foreground/40'}`} />
        <span className="text-label text-muted-foreground/50">{label}</span>
      </div>
      <p className="text-base font-semibold text-foreground tracking-tight text-financial">{value}</p>
    </div>
  );
}
