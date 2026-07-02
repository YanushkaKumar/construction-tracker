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
  PENDING: { label: 'Pending', bgClass: 'bg-warning-subtle', textClass: 'text-warning' },
  APPROVED: { label: 'Approved', bgClass: 'bg-info-subtle', textClass: 'text-info' },
  DELIVERED: { label: 'Delivered', bgClass: 'bg-success-subtle', textClass: 'text-success' },
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

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financials' | 'expenses' | 'progress'>('financials');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

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
      const url = selectedProjectId === 'ALL' ? '/reports/expenses' : `/reports/reports/expenses?projectId=${selectedProjectId}`;
      const response = await apiClient.get(url);
      return response.data;
    },
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

  const selectStyle = "h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Analytics</h1>
          <p className="text-caption mt-1">Audit company operations, budget metrics, and project progression trends.</p>
        </div>
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
        {[
          { id: 'financials', label: 'Financial Health', icon: Landmark },
          { id: 'expenses', label: 'Expense Distribution', icon: TrendingUp },
          { id: 'progress', label: 'Timeline & Progress', icon: Building2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/40 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {isBudgetLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <>
                {/* Financial KPI Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="p-5 text-left">
                      <span className="text-label text-muted-foreground/50 text-[9px] uppercase">Total Budget Estimate</span>
                      <p className="text-2xl font-semibold text-foreground mt-2 tracking-tight text-financial">
                        LKR {(totalEstimate / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Planned capital investment targets</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5 text-left">
                      <span className="text-label text-muted-foreground/50 text-[9px] uppercase">Total Outflow Logged</span>
                      <p className="text-2xl font-semibold text-danger mt-2 tracking-tight text-financial">
                        LKR {(totalActual / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Paid raw material & worker payouts</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5 text-left">
                      <span className="text-label text-muted-foreground/50 text-[9px] uppercase">Total Budget Used</span>
                      <p className="text-2xl font-semibold text-foreground mt-2 tracking-tight text-financial">{overallUtilization}%</p>
                      <div className="mt-2.5">
                        <ProgressBar value={overallUtilization} height={4} color={overallUtilization > 90 ? 'oklch(0.63 0.22 25)' : undefined} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphical Comparison Bar Chart */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-label text-muted-foreground/60">Budget vs Actual Comparison</h3>
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
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-label text-muted-foreground/60 mb-4">Project Budget Health Ledger</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                            <th className="pb-3 pl-2">Project</th>
                            <th className="pb-3">Project Code</th>
                            <th className="pb-3 text-right">Estimated Budget</th>
                            <th className="pb-3 text-right">Actual Expenses</th>
                            <th className="pb-3 pr-2">Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map((b) => {
                            const percent = b.budgetEstimate > 0 ? Math.round((b.budgetActual / b.budgetEstimate) * 100) : 0;
                            return (
                              <tr key={b.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                                <td className="py-3.5 pl-2 font-medium text-foreground">{b.name}</td>
                                <td className="py-3.5 text-muted-foreground text-financial">{b.code}</td>
                                <td className="py-3.5 text-right font-medium text-foreground text-financial">LKR {b.budgetEstimate.toLocaleString()}</td>
                                <td className="py-3.5 text-right font-bold text-danger text-financial">LKR {b.budgetActual.toLocaleString()}</td>
                                <td className="py-3.5 pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-foreground w-8 text-financial">{percent}%</span>
                                    <div className="w-24">
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
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex items-center gap-3 p-4 bg-accent/20 border border-border/30 rounded-2xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-label text-muted-foreground/60 whitespace-nowrap">Select Project</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="max-w-xs h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold"
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
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut Chart Category breakdown */}
                <Card className="lg:col-span-8">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-label text-muted-foreground/60">Category Distribution</h3>
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
                      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground italic">
                        No expenses logged for this project filter.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Table details breakdown */}
                <Card className="lg:col-span-4">
                  <CardContent className="p-6">
                    <h3 className="text-label text-muted-foreground/60 mb-5">Details Breakdown</h3>
                    <div className="space-y-3">
                      {expenses.map((exp, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-border/20 last:border-0 last:pb-0">
                          <span className="font-semibold text-muted-foreground/80">{categoryLabels[exp.category.toUpperCase()] || exp.category}</span>
                          <span className="font-bold text-foreground text-financial">LKR {exp.total.toLocaleString()}</span>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-4 italic">No categories found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {isProgressLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progressList.map((p) => {
                  const ringRadius = 24;
                  const ringCircumference = 2 * Math.PI * ringRadius;
                  const ringOffset = ringCircumference - (p.progressPercent / 100) * ringCircumference;

                  return (
                    <Card key={p.id} className="hover:shadow-panel transition-all duration-200">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-muted-foreground/50">{p.code}</span>
                          <span className="font-semibold text-foreground/80">{p.progressPercent}% Completed</span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground">{p.name}</h4>
                        
                        <div className="flex items-center gap-4 border-t border-border/10 pt-3">
                          <div className="relative w-14 h-14 flex-shrink-0 select-none">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                              <circle
                                cx="30" cy="30" r={ringRadius}
                                className="text-border/40"
                                strokeWidth="5" stroke="currentColor" fill="transparent"
                              />
                              <circle
                                cx="30" cy="30" r={ringRadius}
                                className="text-foreground"
                                strokeWidth="5"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                                strokeLinecap="round"
                                stroke="currentColor" fill="transparent"
                                style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground text-financial">
                              {p.progressPercent}%
                            </div>
                          </div>

                          <div className="flex-1">
                            <ProgressBar value={p.progressPercent} height={4} />
                            <p className="text-[10px] font-semibold text-muted-foreground mt-2">Linear Track View</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-caption pt-3 border-t border-border/10">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/40" />
                            <span>Started: {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/40" />
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
