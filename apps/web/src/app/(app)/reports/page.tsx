'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileSpreadsheet, 
  Loader2, 
  TrendingUp, 
  Landmark, 
  Users, 
  Building2, 
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DonutChart, ResponsiveBarChart } from '@/components/ui/custom-charts';

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

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financials' | 'expenses' | 'progress'>('financials');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Fetch budget vs actual report
  const { data: budgetData, isLoading: isBudgetLoading } = useQuery<BudgetVsActualData[]>({
    queryKey: ['report-budget'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/budget-vs-actual');
      return response.data;
    },
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

  // Fetch progress report
  const { data: progressDataQueryResult, isLoading: isProgressLoading } = useQuery<ProgressData[]>({
    queryKey: ['report-progress'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/progress');
      return response.data;
    },
    retry: 1,
  });

  // Mock fallbacks
  const mockBudget: BudgetVsActualData[] = [
    { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001', budgetEstimate: 150000000, budgetActual: 85000000 },
    { id: 'prj2', name: 'Palm Villa - Negombo', code: 'PRJ-002', budgetEstimate: 45000000, budgetActual: 18000000 },
    { id: 'prj3', name: 'Office Renovation - World Trade Center', code: 'PRJ-003', budgetEstimate: 25000000, budgetActual: 0 },
  ];

  const mockExpenses: ExpenseBreakdownData[] = [
    { category: 'MATERIAL', total: 1795000 },
    { category: 'LABOUR', total: 85000 },
    { category: 'EQUIPMENT', total: 120000 },
  ];

  const mockProgress: ProgressData[] = [
    { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001', progressPercent: 58, startDate: '2025-06-01', endDate: '2027-06-01' },
    { id: 'prj2', name: 'Palm Villa - Negombo', code: 'PRJ-002', progressPercent: 35, startDate: '2026-01-15', endDate: '2026-12-31' },
    { id: 'prj3', name: 'Office Renovation - World Trade Center', code: 'PRJ-003', progressPercent: 0, startDate: '2026-08-01', endDate: '2026-11-30' },
  ];

  const budgets = budgetData || mockBudget;
  const expenses = expenseData || mockExpenses;
  const progressList = progressDataQueryResult || mockProgress;

  // Totals calculations
  const totalEstimate = budgets.reduce((acc, curr) => acc + curr.budgetEstimate, 0);
  const totalActual = budgets.reduce((acc, curr) => acc + curr.budgetActual, 0);
  const overallUtilization = totalEstimate > 0 ? Math.round((totalActual / totalEstimate) * 100) : 0;

  const totalExpenseSum = expenses.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
            Analytics & Reports
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2">
            View financial summaries, expense distributions, and construction timelines.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-max overflow-x-auto">
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
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'scale-110 transition-transform' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels content */}
      <div className="pt-2">
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {isBudgetLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                {/* Financial KPI stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Total Budget Estimate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                        LKR {(totalEstimate / 1000000).toFixed(1)}M
                      </div>
                      <p className="text-xs font-medium text-zinc-500 mt-1.5">Across all planned and active sites</p>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Total Expenses Logged</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-black text-amber-500 tracking-tight">
                        LKR {(totalActual / 1000000).toFixed(1)}M
                      </div>
                      <p className="text-xs font-medium text-zinc-500 mt-1.5">Sum of approved and paid vouchers</p>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Total Budget Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{overallUtilization}%</div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${overallUtilization > 90 ? 'bg-rose-550' : 'bg-emerald-550'}`} 
                          style={{ width: `${Math.min(overallUtilization, 100)}%` }} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphical Comparison */}
                <Card className="border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Budget vs Actual Comparison</CardTitle>
                    <CardDescription>Visual comparison of estimates versus actual spent amounts per project</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ResponsiveBarChart
                      data={budgets}
                      xAxisKey="code"
                      series={[
                        { key: 'budgetEstimate', name: 'Budget Estimate', color: '#3b82f6' }, // Blue
                        { key: 'budgetActual', name: 'Actual Spent', color: '#f59e0b' } // Amber
                      ]}
                    />
                  </CardContent>
                </Card>

                {/* Ledger Comparison */}
                <Card className="border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Project Budget Health Ledger</CardTitle>
                    <CardDescription>Side by side allocation vs logged actual expenditures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                            <th className="pb-3 font-bold">Project</th>
                            <th className="pb-3 font-bold">Project Code</th>
                            <th className="pb-3 font-bold">Estimated Budget</th>
                            <th className="pb-3 font-bold">Actual Expenses</th>
                            <th className="pb-3 font-bold">Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map((b) => {
                            const percent = b.budgetEstimate > 0 ? Math.round((b.budgetActual / b.budgetEstimate) * 100) : 0;
                            return (
                              <tr key={b.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-200">{b.name}</td>
                                <td className="py-3.5 text-zinc-555 font-mono text-xs">{b.code}</td>
                                <td className="py-3.5 text-zinc-850 dark:text-zinc-200 font-semibold">LKR {b.budgetEstimate.toLocaleString()}</td>
                                <td className="py-3.5 text-amber-500 font-bold">LKR {b.budgetActual.toLocaleString()}</td>
                                <td className="py-3.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-8">{percent}%</span>
                                    <div className="w-24 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                        style={{ width: `${Math.min(percent, 100)}%` }} 
                                      />
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
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Project</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="max-w-xs h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350"
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
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Custom chart visualization */}
                <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-8">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Category Distribution</CardTitle>
                    <CardDescription>Graphical visual distribution of costs in LKR</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {expenses.length > 0 ? (
                      <DonutChart
                        data={expenses.map(exp => {
                          const categoryColors: Record<string, string> = {
                            'MATERIAL': '#f59e0b',
                            'LABOUR': '#3b82f6',
                            'EQUIPMENT': '#10b981',
                            'PROJECT_MATERIAL': '#d97706',
                            'SHARED_TOOL': '#8b5cf6',
                            'DAILY_EXPENSE': '#f43f5e',
                            'SERVICE': '#06b6d4',
                            'TRANSPORT': '#ec4899',
                            'OTHER': '#6b7280',
                          };
                          return {
                            label: exp.category,
                            value: exp.total,
                            color: categoryColors[exp.category.toUpperCase()] || '#6b7280'
                          };
                        })}
                        subtitle="Total Spent"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-xs text-zinc-405">
                        No expenses logged for this filter.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Table details */}
                <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Details Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3.5">
                      {expenses.map((exp, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0">
                          <span className="font-bold text-zinc-600 dark:text-zinc-400">{exp.category}</span>
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-50">LKR {exp.total.toLocaleString()}</span>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <p className="text-xs text-zinc-400 text-center py-4">No categories found</p>
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
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {progressList.map((p) => {
                  // Circumference calculations for the circular progress ring
                  const ringRadius = 24;
                  const ringCircumference = 2 * Math.PI * ringRadius;
                  const ringOffset = ringCircumference - (p.progressPercent / 100) * ringCircumference;

                  return (
                    <Card key={p.id} className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span className="font-mono font-bold text-amber-600">{p.code}</span>
                          <span className="font-bold text-zinc-500">{p.progressPercent}% completed</span>
                        </div>
                        <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress Layout with Circular Progress */}
                        <div className="flex items-center gap-4">
                          {/* Circular progress SVG */}
                          <div className="relative w-14 h-14 flex-shrink-0 select-none">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                              {/* Background Circle */}
                              <circle
                                cx="30"
                                cy="30"
                                r={ringRadius}
                                className="text-zinc-100 dark:text-zinc-800"
                                strokeWidth="5.5"
                                stroke="currentColor"
                                fill="transparent"
                              />
                              {/* Foreground Circle */}
                              <circle
                                cx="30"
                                cy="30"
                                r={ringRadius}
                                className="text-amber-500"
                                strokeWidth="5.5"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-zinc-800 dark:text-white">
                              {p.progressPercent}%
                            </div>
                          </div>

                          {/* Horizontal details */}
                          <div className="flex-1 space-y-1.5">
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${p.progressPercent}%` }} />
                            </div>
                            <p className="text-xs font-semibold text-zinc-500">Linear Track View</p>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-3.5 border-t border-zinc-100 dark:border-zinc-850">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-500">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Started: {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-zinc-500">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
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

