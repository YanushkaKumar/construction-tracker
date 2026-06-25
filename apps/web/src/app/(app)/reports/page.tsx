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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Analytics & Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            View financial summaries, expense distributions, and construction timelines.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2 pb-px">
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
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                isActive 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-500 font-semibold' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
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
                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Total Budget Estimate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                        LKR {(totalEstimate / 1000000).toFixed(1)}M
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">Across all planned and active sites</p>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Total Expenses Logged</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-500">
                        LKR {(totalActual / 1000000).toFixed(1)}M
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">Sum of approved and paid vouchers</p>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Total Budget Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{overallUtilization}%</div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${overallUtilization > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(overallUtilization, 100)}%` }} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ledger Comparison */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-base">Project Budget Health Ledger</CardTitle>
                    <CardDescription>Side by side allocation vs logged actual expenditures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                            <th className="pb-3 font-semibold">Project</th>
                            <th className="pb-3 font-semibold">Project Code</th>
                            <th className="pb-3 font-semibold">Estimated Budget</th>
                            <th className="pb-3 font-semibold">Actual Expenses</th>
                            <th className="pb-3 font-semibold">Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map((b) => {
                            const percent = b.budgetEstimate > 0 ? Math.round((b.budgetActual / b.budgetEstimate) * 100) : 0;
                            return (
                              <tr key={b.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{b.name}</td>
                                <td className="py-3.5 text-zinc-500 text-xs">{b.code}</td>
                                <td className="py-3.5 text-zinc-800 dark:text-zinc-200 font-semibold">LKR {b.budgetEstimate.toLocaleString()}</td>
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
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Project</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="max-w-xs h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950"
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Custom chart visualization */}
                <Card className="border-zinc-200 dark:border-zinc-800 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Category Distribution</CardTitle>
                    <CardDescription>Graphical visual distribution of costs in LKR</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {expenses.map((exp, idx) => {
                      const share = totalExpenseSum > 0 ? Math.round((exp.total / totalExpenseSum) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-600 dark:text-zinc-400">{exp.category}</span>
                            <span className="text-zinc-900 dark:text-zinc-200">
                              LKR {exp.total.toLocaleString()} ({share}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full" 
                              style={{ width: `${share}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Table details */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Details Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {expenses.map((exp, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs pb-2.5 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">{exp.category}</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-50">LKR {exp.total.toLocaleString()}</span>
                        </div>
                      ))}
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
                {progressList.map((p) => (
                  <Card key={p.id} className="border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span>{p.code}</span>
                        <span>{p.progressPercent}% completed</span>
                      </div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress bar */}
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${p.progressPercent}%` }} />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Started: {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Target: {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
