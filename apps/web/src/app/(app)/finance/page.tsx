'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Wallet,
  Plus,
  Loader2,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Package,
  Wrench,
  Coffee,
  Truck,
  Briefcase,
  MoreVertical,
  ArrowRight,
  MapPin,
  Clock,
  Hash,
  Trash2,
  CircleDollarSign,
  PieChart,
  Target,
  CheckCircle2,
  Activity,
  Banknote,
  Building2,
  ChevronRight,
  Eye,
  Landmark,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DonutChart, ResponsiveBarChart } from '@/components/ui/custom-charts';
import { BankLoansTab } from './components/BankLoansTab';

// ── Types ─────────────────────────────────

interface Project { id: string; name: string; code: string; status?: string; }
interface UserRef { id: string; firstName: string; lastName: string; }

interface ProjectFinance extends Project {
  budgetEstimate: number;
  totalAdvance: number;
  advanceCount: number;
  totalSpent: number;
  balance: number;
  remainingToReceive: number;
  utilizationPercent: number;
  budgetUtilization: number;
  workDonePercent: number;
  workRemainingPercent: number;
  startDate: string;
  endDate: string;
  tasks: { total: number; completed: number; inProgress: number; todo: number };
}

interface FinanceOverview {
  companyTotals: { totalBudget: number; totalAdvance: number; totalSpent: number; balance: number };
  projectBreakdown: ProjectFinance[];
  categoryBreakdown: Array<{ category: string; total: number; count: number }>;
  assetSummary: { total: number; assigned: number; available: number; byCondition: Array<{ condition: string; count: number }> };
}

interface Advance {
  id: string; projectId: string; amount: number; description: string;
  referenceNo?: string; receivedDate: string; status: string; notes?: string;
  project?: Project; receivedBy?: UserRef;
}

interface PurchaseAllocation {
  id: string; projectId: string; amount: number; percentage: number;
  notes?: string; project?: Project;
}

interface Purchase {
  id: string; title: string; description?: string; totalAmount: number;
  category: string; purchaseDate: string; vendor?: string; notes?: string;
  purchasedBy?: UserRef; allocations: PurchaseAllocation[];
}

interface Asset {
  id: string; name: string; category: string; purchasePrice: number;
  condition: string; serialNumber?: string; notes?: string;
  currentProject?: Project | null; _count?: { assignments: number };
}

interface LedgerEntry {
  id: string; type: 'ADVANCE' | 'PURCHASE'; date: string; description: string;
  amountIn: number; amountOut: number; runningBalance: number;
  referenceNo?: string; category?: string; vendor?: string; user?: UserRef;
}

// ── Schemas ───────────────────────────────

const advanceSchema = z.object({
  amount: z.coerce.number().min(1, 'Required'),
  description: z.string().min(3, 'Required'),
  referenceNo: z.string().optional(),
  receivedDate: z.string().min(1, 'Required'),
  notes: z.string().optional(),
  bankLoanId: z.string().optional(),
});

const purchaseSchema = z.object({
  title: z.string().min(3, 'Required'),
  totalAmount: z.coerce.number().min(0.01, 'Required'),
  category: z.enum(['PROJECT_MATERIAL', 'SHARED_TOOL', 'DAILY_EXPENSE', 'SERVICE', 'TRANSPORT', 'OTHER']),
  purchaseDate: z.string().min(1, 'Required'),
  vendor: z.string().optional(),
  description: z.string().optional(),
  bankLoanId: z.string().optional().nullable(),
});

const assetSchema = z.object({
  name: z.string().min(2, 'Required'),
  category: z.string().min(1, 'Required'),
  purchasePrice: z.coerce.number().min(0),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR']),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

// ── Helpers ───────────────────────────────

const fmt = (n: number) => {
  if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};
const fmtFull = (n: number) => `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const catLabel: Record<string, string> = {
  PROJECT_MATERIAL: 'Material', SHARED_TOOL: 'Shared Tool', DAILY_EXPENSE: 'Daily',
  SERVICE: 'Service', TRANSPORT: 'Transport', OTHER: 'Other',
};
const catEmoji: Record<string, string> = {
  PROJECT_MATERIAL: '🔩', SHARED_TOOL: '🔧', DAILY_EXPENSE: '☕',
  SERVICE: '💼', TRANSPORT: '🚛', OTHER: '📦',
};
const catIcon: Record<string, any> = {
  PROJECT_MATERIAL: Package, SHARED_TOOL: Wrench, DAILY_EXPENSE: Coffee,
  SERVICE: Briefcase, TRANSPORT: Truck, OTHER: MoreVertical,
};
const condColor: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  GOOD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  FAIR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  POOR: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  RETIRED: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};
const statusColor: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-100 text-blue-700', PLANNING: 'bg-zinc-100 text-zinc-600',
  COMPLETED: 'bg-emerald-100 text-emerald-700', ON_HOLD: 'bg-amber-100 text-amber-700',
};

// ══════════════════════════════════════════
// Main Finance Hub
// ══════════════════════════════════════════

export default function FinancePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'bank-loans' | 'advances' | 'purchases' | 'assets' | 'ledger'>('overview');
  const [filterProject, setFilterProject] = useState('');
  const [ledgerProject, setLedgerProject] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Dialogs
  const [advDlg, setAdvDlg] = useState(false);
  const [advProject, setAdvProject] = useState('');
  const [advErr, setAdvErr] = useState<string | null>(null);
  const [purDlg, setPurDlg] = useState(false);
  const [purErr, setPurErr] = useState<string | null>(null);
  const [purAllocs, setPurAllocs] = useState<{ projectId: string; amount: string }[]>([{ projectId: '', amount: '' }]);
  const [astDlg, setAstDlg] = useState(false);
  const [astErr, setAstErr] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignProject, setAssignProject] = useState('');

  // ── Queries ──────────────────────────────

  const { data: projData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'], queryFn: async () => (await apiClient.get('/projects')).data, retry: 1,
  });
  const projects = projData?.data || [];

  const { data: overview, isLoading: ovLoading } = useQuery<FinanceOverview>({
    queryKey: ['finance-overview'], queryFn: async () => (await apiClient.get('/finance/overview')).data, retry: 1,
  });

  const { data: advances, isLoading: advLoading } = useQuery<Advance[]>({
    queryKey: ['advances', filterProject],
    queryFn: async () => (await apiClient.get(`/advances${filterProject ? `?projectId=${filterProject}` : ''}`)).data,
    enabled: tab === 'advances', retry: 1,
  });

  const { data: purchases, isLoading: purLoading } = useQuery<Purchase[]>({
    queryKey: ['purchases', filterProject],
    queryFn: async () => (await apiClient.get(`/purchases${filterProject ? `?projectId=${filterProject}` : ''}`)).data,
    enabled: tab === 'purchases', retry: 1,
  });

  const { data: assets, isLoading: astLoading } = useQuery<Asset[]>({
    queryKey: ['assets'], queryFn: async () => (await apiClient.get('/assets')).data,
    enabled: tab === 'assets', retry: 1,
  });

  const { data: bankLoans } = useQuery<any[]>({
    queryKey: ['bank-loans-list'], queryFn: async () => (await apiClient.get('/bank-loans')).data,
  });

  const { data: ledger, isLoading: ledLoading } = useQuery<{ entries: LedgerEntry[]; summary: { totalIn: number; totalOut: number; finalBalance: number } }>({
    queryKey: ['project-ledger', ledgerProject],
    queryFn: async () => (await apiClient.get(`/finance/projects/${ledgerProject}/ledger`)).data,
    enabled: tab === 'ledger' && !!ledgerProject, retry: 1,
  });

  // ── Forms ────────────────────────────────

  const advForm = useForm({ resolver: zodResolver(advanceSchema), defaultValues: { amount: 0, description: '', referenceNo: '', receivedDate: new Date().toISOString().split('T')[0], notes: '', bankLoanId: '' } });
  const purForm = useForm({ resolver: zodResolver(purchaseSchema), defaultValues: { title: '', totalAmount: 0, category: 'PROJECT_MATERIAL' as const, purchaseDate: new Date().toISOString().split('T')[0], vendor: '', description: '' } });
  const astForm = useForm({ resolver: zodResolver(assetSchema), defaultValues: { name: '', category: 'Tool', purchasePrice: 0, condition: 'NEW' as const, serialNumber: '', notes: '' } });

  // ── Mutations ────────────────────────────

  const invalidateAll = () => { qc.invalidateQueries({ queryKey: ['advances'] }); qc.invalidateQueries({ queryKey: ['purchases'] }); qc.invalidateQueries({ queryKey: ['finance-overview'] }); qc.invalidateQueries({ queryKey: ['project-ledger'] }); qc.invalidateQueries({ queryKey: ['assets'] }); };

  const createAdv = useMutation({
    mutationFn: async (v: any) => (await apiClient.post(`/projects/${advProject}/advances`, v)).data,
    onSuccess: () => { invalidateAll(); setAdvDlg(false); advForm.reset(); setAdvProject(''); },
    onError: (e: any) => setAdvErr(e.response?.data?.message || 'Failed'),
  });

  const createPur = useMutation({
    mutationFn: async (v: any) => {
      const allocs = purAllocs.filter(a => a.projectId && Number(a.amount) > 0).map(a => ({ projectId: a.projectId, amount: Number(a.amount) }));
      return (await apiClient.post('/purchases', { ...v, allocations: allocs })).data;
    },
    onSuccess: () => { invalidateAll(); setPurDlg(false); purForm.reset(); setPurAllocs([{ projectId: '', amount: '' }]); },
    onError: (e: any) => setPurErr(e.response?.data?.message || 'Failed'),
  });

  const createAst = useMutation({
    mutationFn: async (v: any) => (await apiClient.post('/assets', v)).data,
    onSuccess: () => { invalidateAll(); setAstDlg(false); astForm.reset(); },
    onError: (e: any) => setAstErr(e.response?.data?.message || 'Failed'),
  });

  const assignAst = useMutation({
    mutationFn: async () => (await apiClient.post(`/assets/${assignId}/assign`, { projectId: assignProject })).data,
    onSuccess: () => { invalidateAll(); setAssignId(null); setAssignProject(''); },
  });

  const returnAst = useMutation({
    mutationFn: async (id: string) => (await apiClient.post(`/assets/${id}/return`, {})).data,
    onSuccess: () => invalidateAll(),
  });

  const delAdv = useMutation({ mutationFn: async (id: string) => { await apiClient.delete(`/advances/${id}`); }, onSuccess: invalidateAll });
  const delPur = useMutation({ mutationFn: async (id: string) => { await apiClient.delete(`/purchases/${id}`); }, onSuccess: invalidateAll });

  // ── Tab config ──────────────────────────

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'bank-loans', label: 'Bank Loans', icon: Landmark },
    { id: 'advances', label: 'Advances', icon: ArrowDownCircle },
    { id: 'purchases', label: 'Purchases', icon: ArrowUpCircle },
    { id: 'assets', label: 'Assets', icon: Wrench },
    { id: 'ledger', label: 'Ledger', icon: CircleDollarSign },
  ] as const;

  // Select input style
  const selClass = "h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300";
  const inputClass = "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";
  const textareaClass = "flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div className="text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Landmark className="w-6 h-6 text-orange-500" />
            Finance & Treasury Hub
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Command center for managing project budgets, client advances, bank loans, and site assets.
          </p>
        </div>
      </div>

      {/* Segmented Tabs Switcher */}
      <div className="flex bg-zinc-100/50 dark:bg-zinc-800/40 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 overflow-x-auto gap-1 w-max">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button 
              key={id} 
              onClick={() => setTab(id as any)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border border-zinc-200/60 dark:border-zinc-800 shadow-sm' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ TAB 1: OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {ovLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-white/50 dark:bg-zinc-900/50 shimmer-bg" />
              ))}
            </div>
          ) : overview ? (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Total Budgeted" value={fmt(overview.companyTotals.totalBudget)} icon={Target} iconColor="text-zinc-500 bg-zinc-100 dark:bg-zinc-800" sub="Project budget targets" />
                <KpiCard label="Advances Received" value={fmt(overview.companyTotals.totalAdvance)} icon={ArrowDownCircle} iconColor="text-emerald-500 bg-emerald-500/10" sub="Funds received from clients" />
                <KpiCard label="Total Disbursed" value={fmt(overview.companyTotals.totalSpent)} icon={ArrowUpCircle} iconColor="text-rose-500 bg-rose-500/10" sub="Purchase orders logged" />
                <KpiCard label="Treasury Balance" value={fmt(overview.companyTotals.balance)} icon={overview.companyTotals.balance >= 0 ? TrendingUp : TrendingDown} iconColor={overview.companyTotals.balance >= 0 ? 'text-sky-500 bg-sky-500/10' : 'text-rose-500 bg-rose-500/10'} sub={overview.companyTotals.balance >= 0 ? 'Liquid assets' : '⚠ Overspent'} />
              </div>

              {/* Cash Flow Comparison Chart */}
              {overview.projectBreakdown.length > 0 && (
                <Card className="glass-panel">
                  <CardHeader className="border-b border-zinc-200/40 dark:border-zinc-800/40">
                    <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Project Cash Flow Comparison</CardTitle>
                    <CardDescription className="text-zinc-500 mt-1">Visual comparison of advances received versus actual spent per project</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveBarChart
                      data={overview.projectBreakdown}
                      xAxisKey="code"
                      series={[
                        { key: 'totalAdvance', name: 'Advances Received', color: '#10b981' }, // Emerald
                        { key: 'totalSpent', name: 'Total Spent', color: '#f43f5e' } // Rose
                      ]}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Per-Project Cards */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-400" /> Project Financial Status
                </h3>
                <div className="space-y-3">
                  {overview.projectBreakdown.map((p) => (
                    <div key={p.id} className="rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
                      {/* Project Header Bar */}
                      <button
                        onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
                        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                      >
                        <div className={`w-1 h-8 rounded-full flex-shrink-0 ${p.balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold text-orange-500 tracking-wider uppercase">{p.code}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${statusColor[p.status || ''] || 'bg-zinc-100 text-zinc-500'}`}>{p.status?.replace('_', ' ')}</span>
                          </div>
                          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{p.name}</h4>
                        </div>

                        {/* Mini Stats */}
                        <div className="hidden md:flex items-center gap-6 text-[10px]">
                          <div className="text-right">
                            <p className="font-semibold text-zinc-450 uppercase tracking-wide">Budget</p>
                            <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{fmt(p.budgetEstimate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-500 uppercase tracking-wide">Received</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-450 mt-0.5">{fmt(p.totalAdvance)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-rose-500 uppercase tracking-wide">Spent</p>
                            <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">{fmt(p.totalSpent)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold uppercase tracking-wide ${p.balance >= 0 ? 'text-sky-500' : 'text-rose-500'}`}>Balance</p>
                            <p className={`font-bold ${p.balance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-455'} mt-0.5`}>{fmt(p.balance)}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-zinc-450 transition-transform duration-200 ${expandedProject === p.id ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Expanded Details */}
                      {expandedProject === p.id && (
                        <div className="px-5 pb-5 pt-3 border-t border-zinc-200/30 dark:border-zinc-800/40 space-y-5 text-left bg-zinc-550/5 dark:bg-zinc-950/5 animate-in slide-in-from-top-1 duration-200">
                          {/* Financial Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <MiniStat label="Total Budget" value={fmtFull(p.budgetEstimate)} color="zinc" />
                            <MiniStat label="Advances Received" value={fmtFull(p.totalAdvance)} color="emerald" sub={`${p.advanceCount} payment${p.advanceCount !== 1 ? 's' : ''}`} />
                            <MiniStat label="Total Spent" value={fmtFull(p.totalSpent)} color="rose" />
                            <MiniStat label="Balance" value={fmtFull(p.balance)} color={p.balance >= 0 ? 'blue' : 'red'} />
                            <MiniStat label="Remaining Advance" value={fmtFull(p.remainingToReceive)} color="amber" sub={p.remainingToReceive > 0 ? 'To invoice' : 'Fully received'} />
                          </div>

                          {/* Progress Bars */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Fund Utilization */}
                            <div className="p-4 rounded-xl bg-white/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/50">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                                <span className="text-zinc-400">Fund Utilization</span>
                                <span className={p.utilizationPercent > 100 ? 'text-rose-600' : 'text-zinc-500 dark:text-zinc-400'}>{p.utilizationPercent}%</span>
                              </div>
                              <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${p.utilizationPercent > 100 ? 'bg-rose-500' : p.utilizationPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(p.utilizationPercent, 100)}%` }} />
                              </div>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">Spent {fmtFull(p.totalSpent)} of {fmtFull(p.totalAdvance)} received</p>
                            </div>

                            {/* Work Progress */}
                            <div className="p-4 rounded-xl bg-white/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/50">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                                <span className="text-zinc-400">Work Progress</span>
                                <span className="text-sky-500">{p.workDonePercent}%</span>
                              </div>
                              <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${p.workDonePercent}%` }} />
                              </div>
                              <div className="flex gap-3 mt-2 text-[10px] font-semibold">
                                <span className="text-emerald-500">✓ {p.tasks.completed} done</span>
                                <span className="text-sky-500">▶ {p.tasks.inProgress} active</span>
                                <span className="text-zinc-450 dark:text-zinc-500">○ {p.tasks.todo} pending</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <Button size="sm" className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium" onClick={() => { setAdvProject(p.id); setAdvDlg(true); }}>
                              <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5" /> Record Advance
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs font-medium" onClick={() => { setLedgerProject(p.id); setTab('ledger'); }}>
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> View Ledger
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {overview.projectBreakdown.length === 0 && <EmptyState icon={Building2} text="No projects yet" />}
                </div>
              </div>

              {/* Category Spending + Assets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-panel">
                  <CardHeader className="pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40">
                    <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {overview.categoryBreakdown.length > 0 ? (
                      <DonutChart
                        data={overview.categoryBreakdown.map((c) => {
                          const categoryColors: Record<string, string> = {
                            'PROJECT_MATERIAL': '#f97316',       // Orange
                            'SHARED_TOOL': '#8b5cf6',         // Purple
                            'DAILY_EXPENSE': '#f43f5e',       // Rose
                            'SERVICE': '#06b6d4',             // Cyan
                            'TRANSPORT': '#ec4899',           // Pink
                            'OTHER': '#71717a',               // Zinc
                          };
                          return {
                            label: catLabel[c.category] || c.category,
                            value: c.total,
                            color: categoryColors[c.category.toUpperCase()] || '#71717a'
                          };
                        })}
                        subtitle="Total Spent"
                      />
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-6">No purchases yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-panel">
                  <CardHeader className="pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40">
                    <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Assets Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 text-left">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 rounded-xl bg-zinc-500/5 border border-zinc-200/20 dark:border-zinc-800/20">
                        <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{overview.assetSummary.total}</p>
                        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">Total</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                        <p className="text-lg font-bold text-orange-500">{overview.assetSummary.assigned}</p>
                        <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mt-0.5">Assigned</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-450">{overview.assetSummary.available}</p>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Free</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      {overview.assetSummary.byCondition.map((c) => (
                        <div key={c.condition} className="flex justify-between items-center text-xs">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${condColor[c.condition]}`}>{c.condition}</span>
                          <span className="font-bold text-zinc-500">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : <div className="p-12 text-center text-zinc-500"><AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400" />Could not load data</div>}
        </div>
      )}

      {/* ═══ TAB 1.5: BANK LOANS ═══ */}
      {tab === 'bank-loans' && <BankLoansTab />}

      {/* ═══ TAB 2: ADVANCES ═══ */}
      {tab === 'advances' && (
        <div className="space-y-4">
          <div className="flex justify-between gap-3 flex-wrap">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={selClass}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md" onClick={() => { setAdvProject(''); setAdvDlg(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Record Advance
            </Button>
          </div>

          {advLoading ? <Spinner /> : (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4 px-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-2 pl-4">Project</th><th className="pb-2">Description</th><th className="pb-2">Ref</th><th className="pb-2 text-right">Amount</th><th className="pb-2">Date</th><th className="pb-2">By</th><th className="pb-2 pr-4"></th>
                    </tr></thead>
                    <tbody>
                      {(advances || []).map(a => (
                        <tr key={a.id} className="border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                          <td className="py-2.5 pl-4"><span className="text-xs font-bold text-amber-600">{a.project?.code}</span><br /><span className="text-zinc-700 dark:text-zinc-300 font-medium">{a.project?.name}</span></td>
                          <td className="py-2.5 text-zinc-600 dark:text-zinc-400 max-w-[180px] truncate">{a.description}</td>
                          <td className="py-2.5 font-mono text-zinc-400 text-xs">{a.referenceNo || '—'}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-600">{fmtFull(Number(a.amount))}</td>
                          <td className="py-2.5 text-zinc-400">{new Date(a.receivedDate).toLocaleDateString()}</td>
                          <td className="py-2.5 text-zinc-400">{a.receivedBy?.firstName}</td>
                          <td className="py-2.5 pr-4 text-right"><Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-600 p-0.5 h-auto" onClick={() => delAdv.mutate(a.id)}><Trash2 className="w-3 h-3" /></Button></td>
                        </tr>
                      ))}
                      {(!advances || advances.length === 0) && <tr><td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">No advances. Click &quot;Record Advance&quot; to start.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ TAB 3: PURCHASES ═══ */}
      {tab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex justify-between gap-3 flex-wrap">
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={selClass}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
            <Dialog open={purDlg} onOpenChange={setPurDlg}>
              <DialogTrigger render={<Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/10" />}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Log Purchase
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Log Purchase</DialogTitle><DialogDescription>Record a purchase and split costs across projects.</DialogDescription></DialogHeader>
                {purErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{purErr}</AlertDescription></Alert>}
                <form onSubmit={purForm.handleSubmit((v) => { setPurErr(null); createPur.mutate(v); })} className="space-y-3">
                  <div><Label className="text-xs">Title *</Label><Input placeholder="Nuts & Bolts, Tea & Lunch..." {...purForm.register('title')} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Category *</Label><select className={inputClass} {...purForm.register('category')}>
                      {Object.entries(catEmoji).map(([k, v]) => <option key={k} value={k}>{v} {catLabel[k]}</option>)}
                    </select></div>
                    <div><Label className="text-xs">Amount (LKR) *</Label><Input type="number" placeholder="15000" {...purForm.register('totalAmount')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Date *</Label><Input type="date" {...purForm.register('purchaseDate')} /></div>
                    <div><Label className="text-xs">Vendor</Label><Input placeholder="Store name" {...purForm.register('vendor')} /></div>
                  </div>
                  <div>
                    <Label className="text-xs">Paid via Bank Loan (Optional)</Label>
                    <select className={inputClass} {...purForm.register('bankLoanId')}>
                      <option value="">Cash / Company Account (No Loan)</option>
                      {bankLoans?.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.bankName} — Balance: LKR {l.balance.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                  <div><Label className="text-xs">Description</Label><textarea placeholder="Details..." className={textareaClass} {...purForm.register('description')} /></div>

                  {/* Allocation Widget */}
                  <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold">Split Cost Across Projects *</Label>
                      <Button type="button" variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => setPurAllocs([...purAllocs, { projectId: '', amount: '' }])}>
                        <Plus className="w-2.5 h-2.5 mr-0.5" />Add
                      </Button>
                    </div>
                    {purAllocs.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select value={a.projectId} onChange={e => { const u = [...purAllocs]; u[i].projectId = e.target.value; setPurAllocs(u); }} className="flex-1 h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                          <option value="">Select project...</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                        </select>
                        <Input type="number" placeholder="Amount" value={a.amount} onChange={e => { const u = [...purAllocs]; u[i].amount = e.target.value; setPurAllocs(u); }} className="w-24 h-8 text-xs" />
                        {purAllocs.length > 1 && <button type="button" onClick={() => setPurAllocs(purAllocs.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t"><Button type="button" variant="outline" size="sm" onClick={() => setPurDlg(false)}>Cancel</Button><Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={createPur.isPending}>{createPur.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {purLoading ? <Spinner /> : (
            <div className="space-y-2.5">
              {(purchases || []).map(p => {
                const CI = catIcon[p.category] || Package;
                return (
                  <div key={p.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0"><CI className="w-4 h-4 text-zinc-500" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{p.title}</h4>
                          <div className="flex gap-1.5 mt-0.5 text-xs text-zinc-400">
                            <span>{catEmoji[p.category]} {catLabel[p.category]}</span>
                            {p.vendor && <span>• {p.vendor}</span>}
                            <span>• {new Date(p.purchaseDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-rose-600">{fmtFull(Number(p.totalAmount))}</span>
                          <button onClick={() => delPur.mutate(p.id)} className="text-rose-300 hover:text-rose-600 p-0.5"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      {p.allocations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {p.allocations.map(a => (
                            <span key={a.id} className="inline-flex gap-1 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              <span className="text-amber-600">{a.project?.code}</span>
                              <span className="text-zinc-400">→</span>
                              <span className="text-zinc-700 dark:text-zinc-300">{fmtFull(Number(a.amount))}</span>
                              <span className="text-zinc-400">({Number(a.percentage).toFixed(0)}%)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!purchases || purchases.length === 0) && <EmptyState icon={ArrowUpCircle} text="No purchases yet" />}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 4: ASSETS ═══ */}
      {tab === 'assets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={astDlg} onOpenChange={setAstDlg}>
              <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md" />}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Register Asset
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Register Asset</DialogTitle><DialogDescription>Track shared tools and equipment.</DialogDescription></DialogHeader>
                {astErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{astErr}</AlertDescription></Alert>}
                <form onSubmit={astForm.handleSubmit((v) => { setAstErr(null); createAst.mutate(v); })} className="space-y-3">
                  <div><Label className="text-xs">Name *</Label><Input placeholder="Wheelbarrow, Hammer..." {...astForm.register('name')} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Category</Label><select className={inputClass} {...astForm.register('category')}><option>Tool</option><option>Equipment</option><option>Vehicle</option><option>Safety Gear</option><option>Other</option></select></div>
                    <div><Label className="text-xs">Price (LKR)</Label><Input type="number" {...astForm.register('purchasePrice')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Condition</Label><select className={inputClass} {...astForm.register('condition')}><option value="NEW">New</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="POOR">Poor</option></select></div>
                    <div><Label className="text-xs">Serial No.</Label><Input {...astForm.register('serialNumber')} /></div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t"><Button type="button" variant="outline" size="sm" onClick={() => setAstDlg(false)}>Cancel</Button><Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={createAst.isPending}>{createAst.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {assignId && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 rounded-xl">
              <Label className="text-xs font-bold whitespace-nowrap">Assign to:</Label>
              <select value={assignProject} onChange={e => setAssignProject(e.target.value)} className="flex-1 h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-800 dark:bg-zinc-950"><option value="">Select...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
              <Button size="sm" className="text-xs bg-amber-500 text-zinc-950 h-7" onClick={() => assignAst.mutate()} disabled={!assignProject}>Assign</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAssignId(null)}>Cancel</Button>
            </div>
          )}

          {astLoading ? <Spinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(assets || []).map(a => (
                <div key={a.id} className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 left-0 w-1 h-full ${a.currentProject ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="p-4 pl-4.5">
                    <div className="flex justify-between mb-1.5">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{a.name}</h4>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full uppercase ${condColor[a.condition]}`}>{a.condition}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-zinc-400 mb-2">
                      <span>{a.category}</span>
                      {a.serialNumber && <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{a.serialNumber}</span>}
                      <span>• {fmtFull(Number(a.purchasePrice))}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs mb-2.5">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      {a.currentProject ? <span className="font-semibold text-amber-600">{a.currentProject.code} — {a.currentProject.name}</span> : <span className="text-emerald-600 font-semibold">Available</span>}
                    </div>
                    <div className="flex gap-1.5">
                      {a.currentProject && <Button size="sm" variant="outline" className="text-xs h-6 px-2" onClick={() => returnAst.mutate(a.id)}>Return</Button>}
                      <Button size="sm" variant="outline" className="text-xs h-6 px-2 text-amber-600" onClick={() => { setAssignId(a.id); setAssignProject(''); }}><ArrowRight className="w-2.5 h-2.5 mr-0.5" />Assign</Button>
                    </div>
                  </div>
                </div>
              ))}
              {(!assets || assets.length === 0) && <div className="col-span-full"><EmptyState icon={Wrench} text="No assets registered" /></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 5: LEDGER ═══ */}
      {tab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <CircleDollarSign className="w-4 h-4 text-zinc-400" />
            <select value={ledgerProject} onChange={e => setLedgerProject(e.target.value)} className={selClass + ' flex-1 max-w-sm'}>
              <option value="">Choose project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </div>

          {!ledgerProject ? <EmptyState icon={CircleDollarSign} text="Select a project to view its ledger" /> : ledLoading ? <Spinner /> : ledger ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Total In</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtFull(ledger.summary.totalIn)}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                  <p className="text-xs font-bold text-rose-600 uppercase">Total Out</p>
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{fmtFull(ledger.summary.totalOut)}</p>
                </div>
                <div className={`p-3 rounded-xl border ${ledger.summary.finalBalance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'}`}>
                  <p className={`text-xs font-bold uppercase ${ledger.summary.finalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Balance</p>
                  <p className={`text-lg font-bold ${ledger.summary.finalBalance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{fmtFull(ledger.summary.finalBalance)}</p>
                </div>
              </div>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="pt-4 px-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="pb-2 pl-4">Date</th><th className="pb-2">Type</th><th className="pb-2">Description</th><th className="pb-2 text-right">In</th><th className="pb-2 text-right">Out</th><th className="pb-2 pr-4 text-right">Balance</th>
                      </tr></thead>
                      <tbody>
                        {ledger.entries.map((e, i) => (
                          <tr key={e.id + i} className="border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                            <td className="py-2.5 pl-4 text-zinc-400 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="py-2.5"><span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${e.type === 'ADVANCE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{e.type === 'ADVANCE' ? '↓ IN' : '↑ OUT'}</span></td>
                            <td className="py-2.5 max-w-[200px]">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{e.description}</span>
                              {e.category && <span className="text-xs text-zinc-400 ml-1">{catLabel[e.category]}</span>}
                            </td>
                            <td className="py-2.5 text-right font-medium text-emerald-600">{e.amountIn > 0 ? fmtFull(e.amountIn) : '—'}</td>
                            <td className="py-2.5 text-right font-medium text-rose-600">{e.amountOut > 0 ? fmtFull(e.amountOut) : '—'}</td>
                            <td className={`py-2.5 pr-4 text-right font-bold ${e.runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmtFull(e.runningBalance)}</td>
                          </tr>
                        ))}
                        {ledger.entries.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-zinc-400">No transactions</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Global Record Advance Dialog */}
      <Dialog open={advDlg} onOpenChange={setAdvDlg}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Project Advance</DialogTitle>
            <DialogDescription>Money received from a project client.</DialogDescription>
          </DialogHeader>
          {advErr && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{advErr}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={advForm.handleSubmit((v) => { setAdvErr(null); createAdv.mutate(v); })} className="space-y-3">
            <div>
              <Label className="text-xs">Project *</Label>
              <select value={advProject} onChange={e => setAdvProject(e.target.value)} className={inputClass} required>
                <option value="">Select...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount (LKR) *</Label>
                <Input type="number" placeholder="500000" {...advForm.register('amount')} />
                {advForm.formState.errors.amount && <p className="text-xs text-destructive mt-0.5">{advForm.formState.errors.amount.message}</p>}
              </div>
              <div>
                <Label className="text-xs">Date *</Label>
                <Input type="date" {...advForm.register('receivedDate')} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description *</Label>
              <Input placeholder="Advance from client" {...advForm.register('description')} />
            </div>
            <div>
              <Label className="text-xs">Reference No.</Label>
              <Input placeholder="CHQ-2026-001" {...advForm.register('referenceNo')} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <textarea placeholder="Notes..." className={textareaClass} {...advForm.register('notes')} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Funding Source (Optional Bank Loan)</Label>
              <select className={inputClass + ' border-indigo-200 dark:border-indigo-900 focus:ring-indigo-500'} {...advForm.register('bankLoanId')}>
                <option value="">Direct Payment / Cash / Client</option>
                {(bankLoans || []).filter(l => l.status === 'ACTIVE').map(l => (
                  <option key={l.id} value={l.id}>{l.bankName} (Remaining: {fmt(l.balance)})</option>
                ))}
              </select>
              <p className="text-xs text-zinc-400 mt-1">If this advance comes from a bank loan instead of client cash, select it here to track loan allocations.</p>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdvDlg(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={createAdv.isPending || !advProject}>
                {createAdv.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ─────────────────────────

function Spinner() {
  return <div className="flex h-32 items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>;
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
      <Icon className="w-8 h-8 text-zinc-200 dark:text-zinc-700" />
      <p className="text-xs font-semibold text-zinc-500">{text}</p>
    </div>
  );
}

const colorMap: Record<string, { bg: string; text: string }> = {
  zinc: { bg: 'bg-zinc-50 dark:bg-zinc-900', text: 'text-zinc-700 dark:text-zinc-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
};

function KpiCard({ label, value, icon: Icon, iconColor, sub }: { label: string; value: string; icon: any; iconColor: string; sub: string }) {
  return (
    <div className="glass-panel p-4 text-left hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 mt-2">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  const c = colorMap[color] || colorMap.zinc;
  return (
    <div className={`p-2.5 rounded-lg ${c.bg}`}>
      <p className="text-xs font-bold text-zinc-400 uppercase">{label}</p>
      <p className={`text-sm font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}
