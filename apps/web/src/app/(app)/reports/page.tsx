'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileSpreadsheet, Loader2, TrendingUp, Landmark, Users, 
  Building2, SlidersHorizontal, Calendar, Layers, ArrowUpRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DonutChart, ResponsiveBarChart, ProgressBar } from '@/components/ui/custom-charts';

interface BudgetVsActualData {
  id: string;
  name: string;
  code: string;
  budgetEstimate: number;
  budgetActual: number;
}

interface ExpenseBreakdownData {
  category: string;
  total: number;
}

interface ProgressData {
  id: string;
  name: string;
  code: string;
  progressPercent: number;
  startDate?: string;
  endDate?: string;
}

const statusMeta: Record<string, { label: string; bgClass: string; textClass: string }> = {
  PENDING: { label: 'Pending', bgClass: 'bg-warning-subtle/10 border-warning/25', textClass: 'text-warning' },
  APPROVED: { label: 'Approved', bgClass: 'bg-info-subtle/10 border-info/25', textClass: 'text-info' },
  DELIVERED: { label: 'Delivered', bgClass: 'bg-success-subtle/10 border-success/25', textClass: 'text-success' },
};

const categoryColors: Record<string, string> = {
  MATERIAL: 'oklch(0.72 0.14 55)',
  LABOUR: 'oklch(0.62 0.12 250)',
  EQUIPMENT: 'oklch(0.65 0.15 145)',
  PROJECT_MATERIAL: 'oklch(0.70 0.13 60)',
  SHARED_TOOL: 'oklch(0.60 0.16 310)',
  DAILY_EXPENSE: 'oklch(0.65 0.18 25)',
  SERVICE: 'oklch(0.68 0.10 200)',
  TRANSPORT: 'oklch(0.62 0.14 340)',
  OTHER: 'oklch(0.50 0.05 60)',
};

const categoryLabels: Record<string, string> = {
  MATERIAL: 'Material',
  LABOUR: 'Labour',
  EQUIPMENT: 'Equipment',
  PROJECT_MATERIAL: 'Project Materials',
  SHARED_TOOL: 'Shared Tools',
  DAILY_EXPENSE: 'Daily Expenses',
  SERVICE: 'Services',
  TRANSPORT: 'Transport',
  OTHER: 'Miscellaneous',
};

interface LabourReportRow {
  project?: { id: string; name: string; code: string };
  totalWage: number;
  totalHours: number;
  attendanceRecords: number;
}

const LABOUR_RANGES = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
] as const;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financials' | 'expenses' | 'labour' | 'progress'>('financials');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [labourRange, setLabourRange] = useState<string>('30');

  // Fetch budget vs actual report
  const { data: budgetData, isLoading: isBudgetLoading } = useQuery<BudgetVsActualData[]>({
    queryKey: ['report-budget'],
    queryFn: async () => (await apiClient.get('/reports/budget-vs-actual')).data,
    retry: 1,
  });

  // Fetch expense breakdown report
  const { data: expenseData, isLoading: isExpenseLoading } = useQuery<ExpenseBreakdownData[]>({
    queryKey: ['report-expenses', selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId === 'ALL' ? '/reports/expenses' : `/reports/expenses?projectId=${selectedProjectId}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    retry: 1,
  });

  // Fetch labour report for the selected date range
  const { data: labourData, isLoading: isLabourLoading } = useQuery<LabourReportRow[]>({
    queryKey: ['report-labour', labourRange],
    queryFn: async () => {
      const days = LABOUR_RANGES.find(r => r.id === labourRange)?.days ?? 30;
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
      const response = await apiClient.get(`/reports/labour?startDate=${fmtDate(start)}&endDate=${fmtDate(end)}`);
      return response.data;
    },
    enabled: activeTab === 'labour',
    retry: 1,
  });

  // Fetch progress report
  const { data: progressDataQueryResult, isLoading: isProgressLoading } = useQuery<ProgressData[]>({
    queryKey: ['report-progress'],
    queryFn: async () => (await apiClient.get('/reports/progress')).data,
    retry: 1,
  });

  const budgets = budgetData || [];
  const expenses = expenseData || [];
  const progressList = progressDataQueryResult || [];

  // Totals calculations
  const totalEstimate = budgets.reduce((acc, curr) => acc + curr.budgetEstimate, 0);
  const totalActual = budgets.reduce((acc, curr) => acc + curr.budgetActual, 0);
  const overallUtilization = totalEstimate > 0 ? Math.round((totalActual / totalEstimate) * 100) : 0;

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">Operational Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Audit overall corporate financials, cost distribution summaries, and workspace milestones.</p>
        </div>
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/25 p-1 rounded-xl border border-border/25 overflow-x-auto gap-1 w-max select-none">
        {[
          { id: 'financials', label: 'Financial Health', icon: Landmark },
          { id: 'expenses', label: 'Expense Distribution', icon: TrendingUp },
          { id: 'labour', label: 'Labour Costs', icon: Users },
          { id: 'progress', label: 'Timeline & Progress', icon: Building2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/20 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-1 text-left font-semibold">
        {activeTab === 'financials' && (
          <div className="space-y-4">
            {isBudgetLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <>
                {/* Financial KPI Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 select-none">
                  <Card className="glass-panel border-border/30 shadow-surface">
                    <CardContent className="p-4 font-semibold">
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider font-mono">Total Budget Estimate</span>
                      <p className="text-[28px] font-semibold text-foreground/90 mt-1.5 tracking-tight text-financial font-mono">
                        LKR {(totalEstimate / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-semibold tracking-wider font-mono">Planned capital targets</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-border/30 shadow-surface">
                    <CardContent className="p-4 font-semibold">
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider font-mono">Total Outflow Logged</span>
                      <p className="text-[28px] font-semibold text-danger mt-1.5 tracking-tight text-financial font-mono">
                        LKR {(totalActual / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-semibold tracking-wider font-mono">Procured assets & payouts</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-border/30 shadow-surface">
                    <CardContent className="p-4 font-semibold">
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider font-mono">Total Budget Utilized</span>
                      <p className="text-[28px] font-semibold text-foreground/90 mt-1.5 tracking-tight text-financial font-mono">{overallUtilization}%</p>
                      <div className="mt-2.5">
                        <ProgressBar value={overallUtilization} height={4} color={overallUtilization > 90 ? 'oklch(0.63 0.22 25)' : undefined} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphical Comparison Bar Chart */}
                <Card className="glass-panel border-border/30 animate-in slide-in-from-bottom-2 duration-300">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none font-mono">Budget vs Actual Comparison</h3>
                    <ResponsiveBarChart
                      data={budgets}
                      xAxisKey="code"
                      series={[
                        { key: 'budgetEstimate', name: 'Budget Estimate', color: 'oklch(0.62 0.12 250)' },
                        { key: 'budgetActual', name: 'Actual Spent', color: 'oklch(0.65 0.18 25)' }
                      ]}
                    />
                  </CardContent>
                </Card>

                {/* Detailed Table Ledger */}
                <Card className="glass-panel border-border/30 shadow-panel animate-in slide-in-from-bottom-2 duration-300">
                  <CardContent className="p-4">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-4 select-none font-mono">Project Budget Health Ledger</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[15px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[11px] font-mono select-none">
                            <th className="pb-2.5 pl-2">Project</th>
                            <th className="pb-2.5 font-mono">Project Code</th>
                            <th className="pb-2.5 text-right">Estimated Budget</th>
                            <th className="pb-2.5 text-right">Actual Expenses</th>
                            <th className="pb-2.5 pr-2 text-center">Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map((b) => {
                            const percent = b.budgetEstimate > 0 ? Math.round((b.budgetActual / b.budgetEstimate) * 100) : 0;
                            return (
                              <tr key={b.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                                <td className="py-3 pl-2 text-foreground font-semibold">{b.name}</td>
                                <td className="py-3 text-muted-foreground/80 font-medium uppercase font-mono">{b.code}</td>
                                <td className="py-3 text-right text-foreground font-medium text-financial font-mono">LKR {b.budgetEstimate.toLocaleString()}</td>
                                <td className="py-3 text-right font-semibold text-danger text-financial font-mono">LKR {b.budgetActual.toLocaleString()}</td>
                                <td className="py-3 pr-2">
                                  <div className="flex items-center justify-center gap-2 select-none font-mono">
                                    <span className="text-[13px] font-semibold text-foreground w-8 text-financial">{percent}%</span>
                                    <div className="w-20">
                                      <ProgressBar value={percent} height={3} color={percent > 90 ? 'oklch(0.63 0.22 25)' : undefined} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {/* Filter controls */}
            <div className="flex items-center gap-3 p-3.5 bg-accent/15 border border-border/20 rounded-xl select-none text-left">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap font-mono">Filter Workspace</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={selectStyle + ' max-w-xs h-9'}
              >
                <option value="ALL">All Company Sites</option>
                {budgets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {isExpenseLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Donut Chart Category breakdown */}
                <Card className="lg:col-span-8 glass-panel border-border/30">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none font-mono">Category Distribution</h3>
                    {expenses.length > 0 ? (
                      <DonutChart
                        data={expenses.map(exp => ({
                          label: categoryLabels[exp.category.toUpperCase()] || exp.category,
                          value: exp.total,
                          color: categoryColors[exp.category.toUpperCase()] || 'oklch(0.50 0.05 60)'
                        }))}
                        subtitle="Total Spent"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground/50 italic font-medium">
                        No expenses logged for this project workspace.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Table details breakdown */}
                <Card className="lg:col-span-4 glass-panel border-border/30">
                  <CardContent className="p-5">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-5 select-none font-mono">Details Breakdown</h3>
                    <div className="space-y-3 font-semibold">
                      {expenses.map((exp, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[15px] pb-2.5 border-b border-border/15 last:border-0 last:pb-0">
                          <span className="text-muted-foreground/80">{categoryLabels[exp.category.toUpperCase()] || exp.category}</span>
                          <span className="font-semibold text-foreground/90 text-financial font-mono">LKR {exp.total.toLocaleString()}</span>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <p className="text-[15px] text-muted-foreground/45 text-center py-4 italic font-normal">No categories found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'labour' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {/* Date range selector */}
            <div className="flex items-center gap-2 select-none">
              {LABOUR_RANGES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setLabourRange(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border transition-all duration-200 ${
                    labourRange === r.id
                      ? 'bg-card text-foreground border-border/30 shadow-sm'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/40'
                  }`}
                  aria-pressed={labourRange === r.id}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {isLabourLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (labourData ?? []).length === 0 ? (
              <Card className="border-border/30">
                <CardContent className="p-10 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" aria-hidden />
                  <p className="text-[14px] font-semibold text-foreground">No attendance in this period</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Labour costs appear here once site attendance has been marked.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
                  {(() => {
                    const rows = labourData ?? [];
                    const totalWage = rows.reduce((a, r) => a + r.totalWage, 0);
                    const totalHours = rows.reduce((a, r) => a + r.totalHours, 0);
                    const totalRecords = rows.reduce((a, r) => a + r.attendanceRecords, 0);
                    return [
                      { label: 'Total labour cost', value: `LKR ${totalWage.toLocaleString()}` },
                      { label: 'Hours worked', value: totalHours.toLocaleString() },
                      { label: 'Attendance records', value: totalRecords.toLocaleString() },
                    ].map(stat => (
                      <Card key={stat.label} className="border-border/30 shadow-surface">
                        <CardContent className="p-4">
                          <span className="text-[12.5px] font-medium text-muted-foreground">{stat.label}</span>
                          <p className="text-[26px] font-semibold text-foreground mt-1.5 tracking-tight tabular-nums">
                            {stat.value}
                          </p>
                        </CardContent>
                      </Card>
                    ));
                  })()}
                </div>

                {/* Per-project table */}
                <Card className="border-border/30 shadow-surface">
                  <CardContent className="p-4">
                    <h3 className="text-[14px] font-semibold text-foreground mb-4 select-none">Labour cost by project</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[14px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/25 text-muted-foreground text-[12px] font-medium select-none">
                            <th className="pb-2.5 pl-2">Project</th>
                            <th className="pb-2.5">Code</th>
                            <th className="pb-2.5 text-right">Hours</th>
                            <th className="pb-2.5 text-right">Records</th>
                            <th className="pb-2.5 pr-2 text-right">Wages paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(labourData ?? []).map((row, i) => (
                            <tr key={row.project?.id ?? i} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                              <td className="py-3 pl-2 text-foreground font-semibold">{row.project?.name ?? 'Unknown project'}</td>
                              <td className="py-3 text-muted-foreground font-mono text-[13px]">{row.project?.code ?? '—'}</td>
                              <td className="py-3 text-right tabular-nums">{row.totalHours.toLocaleString()}</td>
                              <td className="py-3 text-right tabular-nums">{row.attendanceRecords.toLocaleString()}</td>
                              <td className="py-3 pr-2 text-right font-semibold text-foreground tabular-nums">LKR {row.totalWage.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {isProgressLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progressList.map((p) => {
                  const ringRadius = 22;
                  const ringCircumference = 2 * Math.PI * ringRadius;
                  const ringOffset = ringCircumference - (p.progressPercent / 100) * ringCircumference;

                  return (
                    <Card key={p.id} className="hover:shadow-panel transition-all duration-200 border-border/25 bg-card/65 backdrop-blur-xl">
                      <CardContent className="p-4 space-y-4 text-left font-semibold">
                        <div className="flex items-center justify-between text-xs mb-1 select-none font-mono font-bold">
                          <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-wider">{p.code}</span>
                          <span className="text-[13px] text-foreground font-semibold">{p.progressPercent}% Completed</span>
                        </div>
                        <h4 className="text-[18px] lg:text-[20px] font-bold text-foreground leading-snug">{p.name}</h4>
                        
                        <div className="flex items-center gap-4 border-t border-border/15 pt-3">
                          <div className="relative w-12 h-12 flex-shrink-0 select-none">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                              <circle
                                cx="30" cy="30" r={ringRadius}
                                className="text-border/20"
                                strokeWidth="4.5" stroke="currentColor" fill="transparent"
                              />
                              <circle
                                cx="30" cy="30" r={ringRadius}
                                className="text-foreground"
                                strokeWidth="4.5"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                                strokeLinecap="round"
                                stroke="currentColor" fill="transparent"
                                style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground text-financial font-mono">
                              {p.progressPercent}%
                            </div>
                          </div>

                          <div className="flex-1">
                            <ProgressBar value={p.progressPercent} height={4} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mt-2 select-none font-mono">Linear progress metrics</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[13px] text-muted-foreground/75 pt-3.5 border-t border-border/15 font-semibold font-mono leading-relaxed select-none">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/45" />
                            <span>Started: {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/45" />
                            <span>Target: {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
