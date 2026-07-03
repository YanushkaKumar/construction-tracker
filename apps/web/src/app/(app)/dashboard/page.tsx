'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2, Users, TrendingUp, AlertCircle,
  ArrowUpRight, CheckCircle2, Wallet, CheckSquare,
  FileText, Package, Landmark, Clock, Activity,
  BarChart2, CircleDollarSign, Calendar, Banknote,
  ChevronRight, AlertTriangle, Zap, CloudRain,
  ShieldCheck, Cpu, TrendingDown, Sun, Thermometer,
  HardHat, Sparkles, Coins, ShieldAlert,
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

function WeatherWidget() {
  const hour = new Date().getHours();
  const isRainy = hour >= 14;
  const temp = isRainy ? 26 : 30;
  const condition = isRainy ? 'Monsoonal showers' : 'Partly cloudy';
  const alert = isRainy ? 'Caution: Concrete pour risk' : 'Conditions favourable';
  const alertColor = isRainy ? 'text-danger' : 'text-success';

  return (
    <div className="flex items-center gap-3 bg-card border border-border/20 rounded-2xl px-4 py-2.5 shadow-surface select-none">
      <div className="w-8 h-8 rounded-xl bg-accent/40 border border-border/15 flex items-center justify-center flex-shrink-0" aria-hidden>
        {isRainy ? <CloudRain className="w-4 h-4 text-info" /> : <Sun className="w-4 h-4 text-warning" />}
      </div>
      <div className="text-left font-semibold">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 font-mono">Colombo</span>
          <span className="text-[11px] text-foreground/85">{temp}°C</span>
          <span className="text-[11px] text-muted-foreground/65 font-normal">{condition}</span>
        </div>
        <p className={cn('text-[9px] font-bold uppercase tracking-wider mt-0.5 font-mono', alertColor)}>
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
  const activeRole = selectedRole || user?.role || 'COMPANY_OWNER';

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

  const kpis = dashboardRes?.kpis;
  const activities = dashboardRes?.recentActivities ?? [];
  const finance = financeOverview?.companyTotals;
  const fd = fundingDashboard || { currentCash: 0, availableAdvances: 0, loans: 0, companyFunds: 0, sources: [], timeline: [], insights: [] };

  const riskScore = useMemo(() => {
    return kpis?.pendingExpenses ? Math.min(30 + kpis.pendingExpenses * 8, 95) : 38;
  }, [kpis]);

  const dailyBurn = finance?.totalSpent ? Math.round(finance.totalSpent / 60) : 0;
  const balance = finance?.balance ?? 0;
  const burnPercent = finance?.totalAdvance > 0 ? Math.min(Math.round((finance.totalSpent / finance.totalAdvance) * 100), 100) : 0;

  const projectList = projectsData?.data ?? [];

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

  return (
    <div className="space-y-5 pb-12 text-left" aria-label="FinOS Financial Command Center">
      {/* Redesigned Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="select-none font-semibold">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 font-mono">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <span>•</span>
            <span className="text-indigo-400">FinOS v2.0</span>
          </div>
          <h1 className="text-[2rem] font-bold tracking-tight text-foreground/90 mt-1 leading-none">
            Financial Command Center
          </h1>
          <p className="text-xs text-muted-foreground/60 mt-1 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Active Role: <span className="text-foreground">{activeRole.replace('_', ' ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Demo Role Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-accent/20 border border-border/15 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Switch Role</span>
            <select
              value={activeRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none border-none cursor-pointer"
            >
              <option value="COMPANY_OWNER">Company Owner / CEO</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="SITE_ENGINEER">Site Engineer</option>
              <option value="QUANTITY_SURVEYOR">Procurement / QS</option>
              <option value="ACCOUNTANT">Accountant / Finance</option>
              <option value="WORKER">Worker Supervisor</option>
            </select>
          </div>
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
              {/* AI Advisor Banner */}
              <div className="relative overflow-hidden glass-panel border-border/30 rounded-2xl p-4 flex items-start gap-4 shadow-surface select-none">
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center flex-shrink-0 shadow-surface" aria-hidden>
                  <Cpu className="w-5 h-5 animate-pulse-soft" />
                </div>
                <div className="flex-1 min-w-0 text-left font-semibold">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/75 font-mono">Executive AI Advisor</span>
                    <span className="chip bg-success-subtle border-success/25 text-success">Active</span>
                  </div>
                  <p className="text-[13px] text-foreground/80 leading-relaxed font-semibold">
                    {fd.insights && fd.insights.length > 0
                      ? fd.insights[0]
                      : `All system nodes operating within normal variance thresholds. Treasury balance is positive.`}
                  </p>
                </div>
              </div>

              {/* CEO KPI Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Treasury Net Cash"
                  value={fmt(fd.currentCash)}
                  insight="Liquid cash across all wallets"
                  icon={Wallet}
                  href="/finance"
                />
                <StatCard
                  label="Advances Balance"
                  value={fmt(fd.availableAdvances)}
                  insight="Mobilization funding reserves"
                  icon={CircleDollarSign}
                  href="/finance"
                />
                <StatCard
                  label="Active Loan Balance"
                  value={fmt(fd.loans)}
                  insight="Debt liabilities exposure"
                  attention={fd.loans > 5000000}
                  icon={Landmark}
                  href="/finance"
                />
                <StatCard
                  label="Surplus Company Capital"
                  value={fmt(fd.companyFunds)}
                  insight="Unallocated corporate funds"
                  icon={Coins}
                  href="/finance"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Charts, cash burn progress */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Burn timeline and progress */}
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-center select-none font-semibold">
                        <div>
                          <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Treasury Burn Timeline</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Rolling capital consumption trajectory</p>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground/50">Daily Burn: {fmt(dailyBurn)}</span>
                      </div>

                      <div className="flex h-2 rounded-full overflow-hidden bg-accent/20 gap-0.5" role="img">
                        <div className="bg-success rounded-l" style={{ width: '45%' }} title="Company Cash" />
                        <div className="bg-indigo-400" style={{ width: '35%' }} title="Client Advances" />
                        <div className="bg-danger" style={{ width: '20%' }} title="Loans Committed" />
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
                        <div>🟢 Company Cash <span className="text-foreground block mt-0.5 font-bold text-xs">{fmt(fd.companyFunds)}</span></div>
                        <div>Purple Client Advances <span className="text-foreground block mt-0.5 font-bold text-xs">{fmt(fd.availableAdvances)}</span></div>
                        <div>🔴 Debt Repayments <span className="text-foreground block mt-0.5 font-bold text-xs">{fmt(fd.loans)}</span></div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rolling budget vs actual line chart */}
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4 select-none">
                        <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Operational Inflow/Outflow Trend</h4>
                      </div>
                      {fd.timeline && fd.timeline.length > 0 ? (
                        <div className="h-[200px] w-full flex items-center justify-center">
                          <LineAreaChart
                            data={fd.timeline}
                            xAxisKey="month"
                            series={[{ key: 'amount', name: 'Treasury Outflow', color: '#6366F1' }]}
                            viewHeight={200}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-10 font-bold">No timeline data available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Critical alerts and cross-funding warning */}
                <div className="lg:col-span-4 space-y-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-border/15">
                        <ShieldAlert className="w-4 h-4 text-danger" />
                        <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Treasury Alerts</h4>
                      </div>
                      <div className="space-y-2.5">
                        {fd.insights && fd.insights.map((insight: string, i: number) => {
                          const isLeakage = insight.includes('consuming') || insight.includes('utilization');
                          return (
                            <div key={i} className={cn('p-2.5 border rounded-xl flex items-start gap-2.5', isLeakage ? 'bg-danger-subtle/10 border-danger/20 text-danger' : 'bg-accent/25 border-border/15 text-foreground/80')}>
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] leading-tight font-bold">{insight}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Links */}
                  <div className="grid grid-cols-2 gap-3 select-none">
                    <Link href="/finance" className="p-3 bg-card border border-border/20 rounded-xl hover:bg-accent/25 transition-all text-center">
                      <Coins className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
                      <span className="text-[11px] font-bold text-foreground">Money Center</span>
                    </Link>
                    <Link href="/reports" className="p-3 bg-card border border-border/20 rounded-xl hover:bg-accent/25 transition-all text-center">
                      <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                      <span className="text-[11px] font-bold text-foreground">Ledgers</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROJECT MANAGER HOME */}
          {activeRole === 'PROJECT_MANAGER' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Projects" value={kpis?.activeProjects ?? 0} insight={`${kpis?.totalProjects ?? 0} total registered`} icon={Building2} />
                <StatCard label="Task Backlog" value={kpis?.pendingExpenses || 12} insight="Pending assignments" icon={CheckSquare} />
                <StatCard label="On-Site Today" value={kpis?.workersOnSite ?? 0} insight="Active workforce count" icon={Users} />
                <StatCard label="Avg Progress" value="64%" insight="Completion metric" icon={TrendingUp} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Active Projects checklist */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15">Active Project Metrics</h3>
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
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15">Manager Actions</h4>
                      <div className="flex flex-col gap-2">
                        <Link href="/projects">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Plus className="w-4 h-4 mr-2 text-indigo-400" /> New Project</Button>
                        </Link>
                        <Link href="/tasks">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><CheckSquare className="w-4 h-4 mr-2 text-emerald-400" /> Create Tasks</Button>
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
                <StatCard label="Today's Tasks" value="8" insight="Pending supervision" icon={CheckSquare} />
                <StatCard label="Worker Attendance" value="24 Present" insight="Marked at 08:00 AM" icon={Users} />
                <StatCard label="Equipment Health" value="3 Checked" insight="Excavator & concrete mixers" icon={HardHat} />
                <StatCard label="Daily Logs" value="1 Submitted" insight="Pending PM review" icon={FileText} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Quick Actions */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-4 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15">Site Log Checklist</h3>
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
                  <Card className="glass-panel border-border/25 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15 mb-3">Concrete Pour Risk</h3>
                      <div className="p-3 bg-danger-subtle/10 border border-danger/15 rounded-xl text-danger space-y-1.5">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-bold text-xs">High Precipitation Forecast</p>
                        <p className="text-[10px] text-danger/80">Shower threshold exceeds 25mm in Colombo between 14:00 and 17:00. Postpone structural slab pour.</p>
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
                <StatCard label="Material Types" value={materialsData?.length || 8} insight="Tracked catalog items" icon={Package} />
                <StatCard label="Inventory Alerts" value="2 Items Low" insight="Below minimum stock levels" attention icon={AlertTriangle} />
                <StatCard label="Active Requests" value="3 Pending" insight="Material procurement requests" icon={Clock} />
                <StatCard label="Suppliers Registered" value="6 Active" insight="Qualified vendor listings" icon={Users} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Inventory Alerts List */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15">Stock Depletion Warnings</h3>
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
                  <Card className="glass-panel border-border/25 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15 mb-3">Procurement Links</h3>
                      <div className="flex flex-col gap-2">
                        <Link href="/materials">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Package className="w-4 h-4 mr-2 text-indigo-400" /> Catalog Index</Button>
                        </Link>
                        <Link href="/materials">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Plus className="w-4 h-4 mr-2 text-emerald-400" /> Log Request</Button>
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
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15">Voucher Approval Queue</h3>
                      <div className="space-y-2.5 text-xs font-semibold text-foreground/80">
                        <PendingVouchers approveMutation={approveExpense} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15 mb-3">Accounting Operations</h3>
                      <div className="flex flex-col gap-2">
                        <Link href="/finance">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><Landmark className="w-4 h-4 mr-2 text-indigo-400" /> Repay Bank Loan</Button>
                        </Link>
                        <Link href="/expenses">
                          <Button className="w-full justify-start text-xs rounded-xl h-9" variant="outline"><FileText className="w-4 h-4 mr-2 text-emerald-400" /> View Ledgers</Button>
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
                <StatCard label="Assigned Tasks" value="4" insight="Active work orders" icon={CheckSquare} />
                <StatCard label="Present Days" value="18 / 22" insight="Attendance ratio this month" icon={Users} />
                <StatCard label="Overtime Hours" value="12 hrs" insight="Approved overtime tracker" icon={Clock} />
                <StatCard label="Accrued Wages" value="LKR 63,000" insight="Current monthly estimate" icon={Banknote} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 space-y-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left">
                    <CardContent className="p-5 space-y-3 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15">Active Work Orders</h3>
                      <div className="space-y-2.5 text-xs font-semibold text-foreground/80">
                        <div className="p-3 bg-accent/20 rounded-xl border border-border/15 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">Slab casting preparations</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Marina facility project · Priority P1</p>
                          </div>
                          <span className="chip bg-indigo-500/10 border-indigo-500/20 text-indigo-400">In Progress</span>
                        </div>

                        <div className="p-3 bg-accent/20 rounded-xl border border-border/15 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">Reinforcement mesh laying</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Colombo division · Priority P2</p>
                          </div>
                          <span className="chip bg-muted text-muted-foreground">Pending</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4">
                  <Card className="glass-panel border-border/25 shadow-surface text-left h-full">
                    <CardContent className="p-5 font-semibold">
                      <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-1.5 border-b border-border/15 mb-3">Safety Protocols</h3>
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
    queryFn: async () => (await apiClient.get('/expenses')).data,
    retry: 1,
  });

  const list = pendingRes?.filter(e => e.status === 'PENDING') ?? [];

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
