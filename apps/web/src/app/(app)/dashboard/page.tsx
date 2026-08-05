'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2, Users, TrendingUp, AlertCircle,
  ArrowUpRight, CheckCircle2, Wallet, CheckSquare,
  FileText, Package, Landmark, Clock, Activity,
  BarChart2, CircleDollarSign, Calendar, Banknote,
  ChevronRight, AlertTriangle, Zap, CloudRain,
  ShieldCheck, Cpu, TrendingDown, Sun, Thermometer,
  HardHat, Coins, ShieldAlert,
  FileSpreadsheet, Plus, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonStatGrid, SkeletonChart, SkeletonList } from '@/components/ui/skeleton';
import { DonutChart, ProgressBar, LineAreaChart, RadialGauge } from '@/components/ui/custom-charts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n >= 1_000_000_000) return `LKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `LKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `LKR ${(n / 1_000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};

const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Subcomponents ─────────────────────────────────────────────

// WMO weather codes → short label (https://open-meteo.com/en/docs)
function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function WeatherWidget() {
  const { data: weather } = useQuery({
    queryKey: ['weather-colombo'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current=temperature_2m,precipitation,weather_code&daily=precipitation_sum&timezone=auto&forecast_days=1'
      );
      if (!res.ok) throw new Error('weather unavailable');
      return res.json();
    },
    staleTime: 30 * 60_000,
    retry: 1,
  });

  if (!weather?.current) return null;

  const temp = Math.round(weather.current.temperature_2m);
  const code = weather.current.weather_code as number;
  const rainToday = Number(weather.daily?.precipitation_sum?.[0] ?? 0);
  const condition = weatherLabel(code);
  const isRainy = code >= 51 || rainToday >= 10;
  const alert = isRainy ? 'Rain expected — check concrete pours' : 'Conditions favourable';
  const alertColor = isRainy ? 'text-warning' : 'text-success';

  return (
    <div className="flex items-center gap-3 bg-card border border-border/20 rounded-2xl px-4 py-2.5 shadow-surface select-none">
      <div className="w-8 h-8 rounded-xl bg-accent/40 border border-border/15 flex items-center justify-center flex-shrink-0" aria-hidden>
        {isRainy ? <CloudRain className="w-4 h-4 text-info" /> : <Sun className="w-4 h-4 text-warning" />}
      </div>
      <div className="text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[12px] font-semibold text-foreground">Colombo · {temp}°C</span>
          <span className="text-[12px] text-muted-foreground">{condition}</span>
        </div>
        <p className={cn('text-[11px] font-medium mt-1', alertColor)}>
          {alert}
        </p>
      </div>
    </div>
  );
}

// ── Main Page Redesign ─────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<string>('');
  // Role preview switcher is a demo-only affordance; real accounts see their own role.
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';
  const isOwner = user?.role === 'COMPANY_OWNER';
  const canSwitchRole = isOwner && demoEnabled;
  const activeRole = canSwitchRole ? (selectedRole || user?.role || 'COMPANY_OWNER') : (user?.role || 'WORKER');

  // 1. Fetch KPI & Activities
  const { data: dashboardRes, isLoading: isDashboardLoading } = useQuery<any>({
    queryKey: ['dashboard'],
    queryFn: async () => (await apiClient.get('/dashboard')).data,
    retry: 1,
  });

  // 2. Fetch Finance overview (Treasury totals)
  const { data: financeOverview, isLoading: isFinanceLoading } = useQuery<any>({
    queryKey: ['finance-overview'],
    queryFn: async () => (await apiClient.get('/finance/overview')).data,
    retry: 1,
  });

  // 3. Fetch Funding source dashboard pools
  const { data: fundingDashboard, isLoading: isFundingLoading } = useQuery<any>({
    queryKey: ['funding-dashboard'],
    queryFn: async () => (await apiClient.get('/funding-sources/dashboard')).data,
    retry: 1,
  });

  // 4. Fetch materials inventory levels
  const { data: materialsData } = useQuery<any[]>({
    queryKey: ['materials'],
    queryFn: async () => (await apiClient.get('/materials')).data,
    retry: 1,
  });

  // 5. Fetch project list
  const { data: projectsData } = useQuery<any>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  // 6. Fetch current user's open tasks (field roles)
  const needsMyTasks = activeRole === 'SITE_ENGINEER' || activeRole === 'WORKER';
  const { data: myTasksData } = useQuery<any>({
    queryKey: ['my-tasks'],
    queryFn: async () => (await apiClient.get('/tasks/my-tasks')).data,
    enabled: needsMyTasks,
    retry: 1,
  });

  // 7. Fetch recent daily reports (site engineer)
  const { data: dailyReportsData } = useQuery<any>({
    queryKey: ['daily-reports-recent'],
    queryFn: async () => (await apiClient.get('/daily-reports')).data,
    enabled: activeRole === 'SITE_ENGINEER',
    retry: 1,
  });

  // 8. Fetch procurement data (quantity surveyor)
  const isQS = activeRole === 'QUANTITY_SURVEYOR';
  const { data: materialRequestsData } = useQuery<any>({
    queryKey: ['material-requests-all'],
    queryFn: async () => (await apiClient.get('/material-requests?status=PENDING')).data,
    enabled: isQS,
    retry: 1,
  });
  const { data: suppliersData } = useQuery<any>({
    queryKey: ['suppliers'],
    queryFn: async () => (await apiClient.get('/suppliers')).data,
    enabled: isQS,
    retry: 1,
  });

  const kpis = dashboardRes?.kpis;
  const activities = dashboardRes?.recentActivities ?? [];
  const finance = financeOverview?.companyTotals;
  const fd = fundingDashboard || { currentCash: 0, availableAdvances: 0, loans: 0, companyFunds: 0, sources: [], timeline: [], insights: [] };

  const dailyBurn = finance?.totalSpent ? Math.round(finance.totalSpent / 60) : 0;
  const balance = finance?.balance ?? 0;
  const burnPercent = finance?.totalAdvance > 0 ? Math.min(Math.round((finance.totalSpent / finance.totalAdvance) * 100), 100) : 0;

  const projectList = projectsData?.data ?? [];
  const myTasks: any[] = Array.isArray(myTasksData) ? myTasksData : (myTasksData?.data ?? []);
  const dailyReports: any[] = Array.isArray(dailyReportsData) ? dailyReportsData : (dailyReportsData?.data ?? []);
  const todayStr = new Date().toDateString();
  const reportsToday = dailyReports.filter(r => new Date(r.reportDate ?? r.createdAt).toDateString() === todayStr).length;
  const lowStockCount = (materialsData ?? []).filter((m: any) => m.currentStock <= m.minimumStock).length;
  const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pendingRequestCount = (Array.isArray(materialRequestsData) ? materialRequestsData : (materialRequestsData?.data ?? [])).length;
  const suppliersCount = (Array.isArray(suppliersData) ? suppliersData : (suppliersData?.data ?? [])).length;
  const avgProgress = projectList.length > 0
    ? Math.round(projectList.reduce((sum: number, p: any) => sum + (p.progressPercent ?? 0), 0) / projectList.length)
    : 0;

  // Mutate approvals for Accountant dashboard
  const approveExpense = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.post(`/expenses/${id}/approve`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
    }
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-5 pb-12 text-left" aria-label="Dashboard">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="select-none">
          <p className="text-[13px] text-muted-foreground/70 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground mt-0.5 leading-tight">
            {greeting}{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-[13px] text-muted-foreground/70 mt-0.5">
            Here&apos;s what&apos;s happening across your projects today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Role view switcher — demo mode only */}
          {canSwitchRole && (
            <div className="flex items-center gap-2 bg-card border border-border/30 rounded-xl px-3 py-1.5 shadow-surface">
              <span className="text-[12px] font-medium text-muted-foreground">View as</span>
              <select
                value={activeRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-[12.5px] font-semibold text-foreground focus:outline-none border-none cursor-pointer"
              >
                <option value="COMPANY_OWNER">Company Owner</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="SITE_ENGINEER">Site Engineer</option>
                <option value="QUANTITY_SURVEYOR">Procurement / QS</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="WORKER">Worker Supervisor</option>
              </select>
            </div>
          )}
          <WeatherWidget />
        </div>
      </div>

      {isDashboardLoading || isFinanceLoading || isFundingLoading ? (
        <div className="space-y-4">
          <SkeletonStatGrid count={4} cols={4} />
          <SkeletonChart height={280} />
        </div>
      ) : (
        <>
          {/* 1. COMPANY OWNER / CEO HOME */}
          {activeRole === 'COMPANY_OWNER' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Treasury Balance"
                  value={fmt(fd.currentCash)}
                  insight="Total liquid cash"
                  icon={Wallet}
                  href="/finance"
                />
                <StatCard
                  label="Active Projects"
                  value={kpis?.activeProjects ?? 0}
                  insight="Currently running"
                  icon={Building2}
                  href="/projects"
                />
                <StatCard
                  label="Workers On Site"
                  value={kpis?.workersOnSite ?? 0}
                  insight="Marked present today"
                  icon={Users}
                  href="/workers"
                />
                <StatCard
                  label="Pending Approvals"
                  value={kpis?.pendingExpenses ?? 0}
                  insight="Awaiting your review"
                  icon={CheckSquare}
                  href="/expenses"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Quick Actions */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left h-full">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Quick Actions</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Link href="/purchases">
                          <Button className="w-full h-16 flex flex-col gap-1 items-center justify-center rounded-xl bg-accent/20 border border-border/20 hover:bg-accent/40 text-foreground transition-all">
                            <Landmark className="w-5 h-5 text-primary" />
                            <span className="text-[11px] font-semibold">Add Purchase</span>
                          </Button>
                        </Link>
                        <Link href="/assets">
                          <Button className="w-full h-16 flex flex-col gap-1 items-center justify-center rounded-xl bg-accent/20 border border-border/20 hover:bg-accent/40 text-foreground transition-all">
                            <HardHat className="w-5 h-5 text-info" />
                            <span className="text-[11px] font-semibold">Add Asset</span>
                          </Button>
                        </Link>
                        <Link href="/projects">
                          <Button className="w-full h-16 flex flex-col gap-1 items-center justify-center rounded-xl bg-accent/20 border border-border/20 hover:bg-accent/40 text-foreground transition-all">
                            <Building2 className="w-5 h-5 text-success" />
                            <span className="text-[11px] font-semibold">New Project</span>
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Critical alerts */}
                <div className="lg:col-span-4 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left h-full">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-border/15">
                        <ShieldAlert className="w-4 h-4 text-warning" />
                        <h4 className="text-[14px] font-semibold text-foreground">Treasury Alerts</h4>
                      </div>
                      <div className="space-y-2.5">
                        {fd.insights && fd.insights.length > 0 ? fd.insights.map((insight: string, i: number) => {
                          const isLeakage = insight.includes('consuming') || insight.includes('utilization');
                          return (
                            <div key={i} className={cn('p-2.5 border rounded-xl flex items-start gap-2.5', isLeakage ? 'bg-danger-subtle/10 border-danger/20 text-danger' : 'bg-accent/25 border-border/15 text-foreground/80')}>
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] leading-tight font-bold">{insight}</p>
                            </div>
                          );
                        }) : (
                          <div className="p-3 bg-success-subtle/10 border border-success/15 rounded-xl text-success text-[12px]">
                            No critical alerts today.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROJECT MANAGER HOME */}
          {activeRole === 'PROJECT_MANAGER' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Projects" value={kpis?.activeProjects ?? 0} insight={`${kpis?.totalProjects ?? 0} total registered`} icon={Building2} href="/projects" />
                <StatCard label="Pending Approvals" value={kpis?.pendingExpenses ?? 0} insight="Expense vouchers awaiting review" icon={CheckSquare} href="/expenses" />
                <StatCard label="On-Site Today" value={kpis?.workersOnSite ?? 0} insight="Active workforce count" icon={Users} href="/workers" />
                <StatCard label="Avg Progress" value={avgProgress} valueSuffix="%" insight="Across active projects" icon={TrendingUp} href="/projects" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Active Projects checklist */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Active Project Metrics</h3>
                      <div className="space-y-4">
                        {projectList.map((p: any) => (
                          <div key={p.id} className="space-y-1.5 font-semibold text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground">{p.name} <span className="text-[10px] font-mono text-muted-foreground/50">({p.code})</span></span>
                              <span className="text-muted-foreground/75 font-mono">Progress: {p.progressPercent || 0}%</span>
                            </div>
                            <ProgressBar value={p.progressPercent || 0} max={100} height={5} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Quick actions and logs */}
                <div className="lg:col-span-4 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h4 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Manager Actions</h4>
                      <div className="flex flex-col gap-2">
                        <Link href="/projects">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Plus className="w-4 h-4 mr-2 text-primary" /> New Project</Button>
                        </Link>
                        <Link href="/tasks">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><CheckSquare className="w-4 h-4 mr-2 text-success" /> Create Tasks</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 3. SITE ENGINEER HOME */}
          {activeRole === 'SITE_ENGINEER' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="My Open Tasks" value={myTasks.length} insight={overdueTasks > 0 ? `${overdueTasks} overdue` : 'Nothing overdue'} attention={overdueTasks > 0} icon={CheckSquare} href="/tasks" />
                <StatCard label="Workers On Site" value={kpis?.workersOnSite ?? 0} insight="Marked present today" icon={Users} href="/workers" />
                <StatCard label="Low Stock Items" value={lowStockCount} insight={lowStockCount > 0 ? 'Below minimum level' : 'Stock levels healthy'} attention={lowStockCount > 0} icon={Package} href="/materials" />
                <StatCard label="Daily Logs Today" value={reportsToday} insight={reportsToday > 0 ? 'Submitted for review' : 'No log submitted yet'} icon={FileText} href="/daily-reports" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Quick Actions */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left">
                    <CardContent className="p-5 space-y-4 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Site Log Checklist</h3>
                      <div className="space-y-3 font-semibold text-xs">
                        <div className="p-3 bg-accent/20 rounded-xl border border-border/15 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">Mark Attendance Batch</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Mark present workers for active sites</p>
                          </div>
                          <Link href="/workers">
                            <Button size="sm" className="h-8 rounded-lg text-[10px] font-bold bg-foreground text-background">Mark Now</Button>
                          </Link>
                        </div>

                        <div className="p-3 bg-accent/20 rounded-xl border border-border/15 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">Submit Daily Report</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Submit weather, issues and works details</p>
                          </div>
                          <Link href="/daily-reports">
                            <Button size="sm" className="h-8 rounded-lg text-[10px] font-bold bg-foreground text-background">Log Daily</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4">
                  <Card className="border border-border/30 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15 mb-3">Site Reminders</h3>
                      <div className="space-y-2.5">
                        <div className="p-3 bg-warning-subtle border border-warning/20 rounded-xl space-y-1">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <p className="font-semibold text-xs text-foreground">Check the weather before pours</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Confirm today&apos;s forecast in the header before scheduling structural concrete work.</p>
                        </div>
                        <div className="p-3 bg-info-subtle border border-info/20 rounded-xl space-y-1">
                          <FileText className="w-4 h-4 text-info" />
                          <p className="font-semibold text-xs text-foreground">Submit your daily log</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Log weather, workforce, and progress before end of day so the PM can review.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 4. QUANTITY SURVEYOR / PROCUREMENT HOME */}
          {activeRole === 'QUANTITY_SURVEYOR' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Material Types" value={materialsData?.length ?? 0} insight="Tracked catalog items" icon={Package} href="/materials" />
                <StatCard label="Inventory Alerts" value={lowStockCount} insight={lowStockCount > 0 ? 'Below minimum stock levels' : 'Stock levels healthy'} attention={lowStockCount > 0} icon={AlertTriangle} href="/materials" />
                <StatCard label="Pending Requests" value={pendingRequestCount} insight="Material procurement requests" icon={Clock} href="/materials" />
                <StatCard label="Active Suppliers" value={suppliersCount} insight="Qualified vendor listings" icon={Users} href="/materials" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Inventory Alerts List */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Stock Depletion Warnings</h3>
                      <div className="space-y-2.5 text-xs">
                        {materialsData && materialsData.filter((m: any) => m.currentStock <= m.minimumStock).map((m: any) => (
                          <div key={m.id} className="p-3 bg-warning-subtle/10 border border-warning/15 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-foreground">{m.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">Current Stock: {m.currentStock} {m.unit} | Minimum Required: {m.minimumStock} {m.unit}</p>
                            </div>
                            <Link href="/materials">
                              <Button size="sm" className="h-8 rounded-lg text-[10px] font-bold bg-foreground text-background">Reorder</Button>
                            </Link>
                          </div>
                        ))}
                        {(!materialsData || materialsData.filter((m: any) => m.currentStock <= m.minimumStock).length === 0) && (
                          <div className="p-3 bg-success-subtle/10 border border-success/15 rounded-xl text-success font-semibold">
                            All materials stocks are above target limits.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4">
                  <Card className="border border-border/30 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15 mb-3">Procurement Links</h3>
                      <div className="flex flex-col gap-2">
                        <Link href="/materials">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Package className="w-4 h-4 mr-2 text-primary" /> Catalog Index</Button>
                        </Link>
                        <Link href="/materials">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Plus className="w-4 h-4 mr-2 text-success" /> Log Request</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 5. ACCOUNTANT / FINANCE OFFICER HOME */}
          {activeRole === 'ACCOUNTANT' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Pending Expenses" value={kpis?.pendingExpenses ?? 0} insight="Awaiting voucher approval" attention={(kpis?.pendingExpenses ?? 0) > 0} icon={AlertCircle} />
                <StatCard label="Pending Amount" value={fmt(kpis?.pendingExpenseAmount ?? 0)} insight="Approval cash sum" icon={CircleDollarSign} />
                <StatCard label="Active Debt Balance" value={fmt(fd.loans)} insight="Outstanding bank debt exposure" icon={Landmark} />
                <StatCard label="Surplus Cash" value={fmt(fd.companyFunds)} insight="Free liquid capital" icon={Wallet} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Voucher Approval List */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Voucher Approval Queue</h3>
                      <div className="space-y-2.5 text-xs font-semibold text-foreground/80">
                        <PendingVouchers approveMutation={approveExpense} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4">
                  <Card className="border border-border/30 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15 mb-3">Accounting Operations</h3>
                      <div className="flex flex-col gap-2">
                        <Link href="/finance">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Landmark className="w-4 h-4 mr-2 text-primary" /> Repay Bank Loan</Button>
                        </Link>
                        <Link href="/expenses">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><FileText className="w-4 h-4 mr-2 text-success" /> View Ledgers</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 6. WORKER HOME */}
          {activeRole === 'WORKER' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Assigned Tasks" value={myTasks.length} insight="Active work orders" icon={CheckSquare} href="/tasks" />
                <StatCard label="In Progress" value={inProgressTasks} insight="Currently being worked" icon={Clock} href="/tasks" />
                <StatCard label="Overdue" value={overdueTasks} insight={overdueTasks > 0 ? 'Needs attention' : 'All on schedule'} attention={overdueTasks > 0} icon={AlertTriangle} href="/tasks" />
                <StatCard label="Due This Week" value={myTasks.filter(t => { if (!t.dueDate) return false; const d = new Date(t.dueDate); const week = new Date(); week.setDate(week.getDate() + 7); return d >= new Date() && d <= week; }).length} insight="Upcoming deadlines" icon={Calendar} href="/tasks" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 space-y-4">
                  <Card className="border border-border/30 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15">Active Work Orders</h3>
                      <div className="space-y-2.5 text-xs font-semibold text-foreground/80">
                        {myTasks.length === 0 && (
                          <div className="p-4 bg-accent/20 rounded-xl border border-border/15 text-center">
                            <p className="text-[13px] font-semibold text-foreground">No open tasks</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5 font-normal">Tasks assigned to you will appear here.</p>
                          </div>
                        )}
                        {myTasks.slice(0, 5).map((t: any) => (
                          <Link key={t.id} href="/tasks" className="p-3 bg-accent/20 rounded-xl border border-border/15 flex items-center justify-between hover:bg-accent/35 transition-colors">
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{t.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 font-normal truncate">
                                {t.project?.name ?? 'Unassigned project'}
                                {t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}
                              </p>
                            </div>
                            <span className={cn(
                              'chip flex-shrink-0 ml-3',
                              t.status === 'IN_PROGRESS'
                                ? 'bg-info-subtle border-info/25 text-info'
                                : t.dueDate && new Date(t.dueDate) < new Date()
                                  ? 'bg-danger-subtle border-danger/25 text-danger'
                                  : 'bg-muted text-muted-foreground'
                            )}>
                              {t.status === 'IN_PROGRESS' ? 'In Progress' : t.dueDate && new Date(t.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4">
                  <Card className="border border-border/30 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[14px] font-semibold text-foreground pb-1.5 border-b border-border/15 mb-3">Safety Protocols</h3>
                      <div className="p-3 bg-success-subtle/10 border border-success/15 rounded-xl text-success space-y-1">
                        <ShieldCheck className="w-5 h-5" />
                        <p className="font-bold text-xs">Site Safety Compliant</p>
                        <p className="text-[10px] text-success/80">Always wear high-visibility vest, harness, and hard hat during overhead structural assembly.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Accountant Pending Vouchers helper subcomponent ─────────────────────────────

function PendingVouchers({ approveMutation }: { approveMutation: any }) {
  const { data: pendingRes, isLoading } = useQuery<any[]>({
    queryKey: ['pending-vouchers-list'],
    queryFn: async () => (await apiClient.get('/expenses/pending')).data,
    retry: 1,
  });

  const list = pendingRes ?? [];

  if (isLoading) return <SkeletonList items={3} />;
  if (list.length === 0) {
    return (
      <div className="p-3 bg-success-subtle/10 border border-success/15 rounded-xl text-success font-semibold">
        No pending expense vouchers awaiting approval.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {list.map((item: any) => (
        <div key={item.id} className="p-3 bg-accent/20 rounded-xl border border-border/15 flex items-center justify-between hover:bg-accent/30 transition-colors">
          <div>
            <p className="font-bold text-foreground">{item.title}</p>
            <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">Amount: {fmt(item.amount)} | Category: {item.category} | Project: {item.project?.name}</p>
          </div>
          <Button
            size="sm"
            onClick={() => approveMutation.mutate(item.id)}
            disabled={approveMutation.isPending}
            className="h-8 rounded-lg text-[10px] font-bold bg-foreground text-background"
          >
            {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve'}
          </Button>
        </div>
      ))}
    </div>
  );
}
