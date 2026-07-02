'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Wallet, Plus, Loader2, AlertCircle, ArrowDownCircle, ArrowUpCircle,
  TrendingUp, TrendingDown, Package, Wrench, Coffee, Truck, Briefcase,
  MoreVertical, ArrowRight, MapPin, Clock, Hash, Trash2, CircleDollarSign,
  PieChart, Target, CheckCircle2, Activity, Banknote, Building2,
  ChevronRight, Eye, Landmark,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DonutChart, ProgressBar } from '@/components/ui/custom-charts';
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
  NEW: 'bg-success-subtle text-success',
  GOOD: 'bg-info-subtle text-info',
  FAIR: 'bg-warning-subtle text-warning',
  POOR: 'bg-danger-subtle text-danger',
  RETIRED: 'bg-accent text-muted-foreground',
};
const statusColor: Record<string, string> = {
  IN_PROGRESS: 'bg-info-subtle text-info', PLANNING: 'bg-accent text-muted-foreground',
  COMPLETED: 'bg-success-subtle text-success', ON_HOLD: 'bg-warning-subtle text-warning',
};

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'bank-loans', label: 'Bank Loans', icon: Landmark },
    { id: 'advances', label: 'Advances', icon: ArrowDownCircle },
    { id: 'purchases', label: 'Purchases', icon: ArrowUpCircle },
    { id: 'assets', label: 'Assets', icon: Wrench },
    { id: 'ledger', label: 'Ledger', icon: CircleDollarSign },
  ] as const;

  const selectStyle = "h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30";
  const textareaStyle = "flex min-h-[60px] w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 resize-none placeholder:text-muted-foreground/60";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Treasury</h1>
          <p className="text-caption mt-1">Monitor project allocations, advances, bank loans, and corporate assets.</p>
        </div>
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/40 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
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
        <div className="space-y-6">
          {ovLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-accent/20 shimmer-bg" />
              ))}
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Total Budgeted" value={fmt(overview.companyTotals.totalBudget)} icon={Target} bgClass="bg-accent/40" iconColor="text-muted-foreground/50" sub="Project targets" />
                <KpiCard label="Advances Received" value={fmt(overview.companyTotals.totalAdvance)} icon={ArrowDownCircle} bgClass="bg-success-subtle" iconColor="text-success" sub="Client capital inputs" />
                <KpiCard label="Total Disbursed" value={fmt(overview.companyTotals.totalSpent)} icon={ArrowUpCircle} bgClass="bg-danger-subtle" iconColor="text-danger" sub="Material & labor spend" />
                <KpiCard label="Balance" value={fmt(overview.companyTotals.balance)} icon={overview.companyTotals.balance >= 0 ? TrendingUp : TrendingDown} bgClass={overview.companyTotals.balance >= 0 ? 'bg-info-subtle' : 'bg-danger-subtle'} iconColor={overview.companyTotals.balance >= 0 ? 'text-info' : 'text-danger'} sub="Treasury reserves" />
              </div>

              {/* Project breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-label text-muted-foreground/60">Project Budget Utilization</h3>
                    <div className="space-y-4">
                      {overview.projectBreakdown.map((p) => {
                        const balanceColor = p.balance >= 0 ? 'text-success' : 'text-danger';
                        const isExpanded = expandedProject === p.id;
                        return (
                          <div key={p.id} className="border border-border/30 rounded-xl p-4 space-y-3 transition-colors hover:bg-accent/5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="text-label text-muted-foreground/50 text-[9px]">{p.code}</span>
                                <h4 className="text-xs font-semibold text-foreground">{p.name}</h4>
                              </div>
                              <Button variant="ghost" size="icon-xs" onClick={() => setExpandedProject(isExpanded ? null : p.id)}>
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </div>

                            <ProgressBar value={p.budgetUtilization} label="Budget Utilized" showLabel height={4} color={p.budgetUtilization > 90 ? 'oklch(0.63 0.22 25)' : undefined} />

                            {isExpanded && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border/20 text-xs">
                                <div>
                                  <span className="text-caption text-[10px]">Client Advances</span>
                                  <p className="font-semibold text-foreground text-financial">{fmt(p.totalAdvance)}</p>
                                </div>
                                <div>
                                  <span className="text-caption text-[10px]">Total Outflow</span>
                                  <p className="font-semibold text-foreground text-financial">{fmt(p.totalSpent)}</p>
                                </div>
                                <div>
                                  <span className="text-caption text-[10px]">Reserves Balance</span>
                                  <p className={`font-semibold text-financial ${balanceColor}`}>{fmt(p.balance)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Assets Summary Panel */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-label text-muted-foreground/60">Assets Ledger</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-accent/30 border border-border/20 rounded-xl">
                        <p className="text-sm font-bold text-foreground text-financial">{overview.assetSummary.total}</p>
                        <p className="text-label text-muted-foreground/40 text-[8px] mt-0.5">Total</p>
                      </div>
                      <div className="p-2.5 bg-warning-subtle rounded-xl">
                        <p className="text-sm font-bold text-warning text-financial">{overview.assetSummary.assigned}</p>
                        <p className="text-label text-warning/75 text-[8px] mt-0.5">Assigned</p>
                      </div>
                      <div className="p-2.5 bg-success-subtle rounded-xl">
                        <p className="text-sm font-bold text-success text-financial">{overview.assetSummary.available}</p>
                        <p className="text-label text-success/75 text-[8px] mt-0.5">Available</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      {overview.assetSummary.byCondition.map((c) => (
                        <div key={c.condition} className="flex justify-between items-center text-xs">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${condColor[c.condition]}`}>{c.condition}</span>
                          <span className="font-semibold text-muted-foreground text-financial">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : <div className="p-12 text-center text-muted-foreground">Could not load finances overview</div>}
        </div>
      )}

      {/* ═══ TAB 1.5: BANK LOANS ═══ */}
      {tab === 'bank-loans' && <BankLoansTab />}

      {/* ═══ TAB 2: ADVANCES ═══ */}
      {tab === 'advances' && (
        <div className="space-y-4 stagger-children">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={selectStyle}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
            <Button onClick={() => { setAdvProject(''); setAdvDlg(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Record Advance
            </Button>
          </div>

          {advLoading ? <Spinner /> : (
            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Project</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Ref</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Recipient</th>
                        <th className="pb-3 pr-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(advances || []).map(a => (
                        <tr key={a.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                          <td className="py-3 pl-2">
                            <span className="text-[10px] font-bold text-muted-foreground/60">{a.project?.code}</span>
                            <div className="font-semibold text-foreground">{a.project?.name}</div>
                          </td>
                          <td className="py-3 text-muted-foreground max-w-[180px] truncate">{a.description}</td>
                          <td className="py-3 text-muted-foreground text-financial">{a.referenceNo || '—'}</td>
                          <td className="py-3 text-right font-semibold text-success text-financial">{fmtFull(Number(a.amount))}</td>
                          <td className="py-3 text-muted-foreground">{new Date(a.receivedDate).toLocaleDateString()}</td>
                          <td className="py-3 text-muted-foreground">{a.receivedBy?.firstName}</td>
                          <td className="py-3 pr-2 text-right">
                            <button className="text-muted-foreground hover:text-danger p-1 transition-colors" onClick={() => delAdv.mutate(a.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!advances || advances.length === 0) && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground italic">No advances logged yet.</td></tr>}
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
        <div className="space-y-4 stagger-children">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={selectStyle}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
            <Dialog open={purDlg} onOpenChange={setPurDlg}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Log Purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Purchase</DialogTitle>
                  <DialogDescription>Record a purchase order and split costs across projects.</DialogDescription>
                </DialogHeader>
                {purErr && <Alert variant="destructive"><AlertDescription>{purErr}</AlertDescription></Alert>}
                <form onSubmit={purForm.handleSubmit((v) => { setPurErr(null); createPur.mutate(v); })} className="space-y-3">
                  <div>
                    <Label className="text-caption">Title *</Label>
                    <Input placeholder="Hardware, raw cement, lumber…" {...purForm.register('title')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">Category *</Label>
                      <select className={selectStyle + ' w-full h-9 font-medium'} {...purForm.register('category')}>
                        {Object.entries(catEmoji).map(([k, v]) => <option key={k} value={k}>{v} {catLabel[k]}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-caption">Amount (LKR) *</Label>
                      <Input type="number" placeholder="15000" {...purForm.register('totalAmount')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">Date *</Label>
                      <Input type="date" {...purForm.register('purchaseDate')} />
                    </div>
                    <div>
                      <Label className="text-caption">Vendor</Label>
                      <Input placeholder="Supplier Store" {...purForm.register('vendor')} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-caption">Paid via Bank Loan (Optional)</Label>
                    <select className={selectStyle + ' w-full h-9 font-medium'} {...purForm.register('bankLoanId')}>
                      <option value="">Cash / Company Account (No Loan)</option>
                      {bankLoans?.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.bankName} — Balance: {fmt(l.balance)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-caption">Description</Label>
                    <textarea placeholder="Detail summary…" className={textareaStyle} {...purForm.register('description')} />
                  </div>

                  {/* Split costs allocation widget */}
                  <div className="space-y-2.5 pt-3 border-t border-border/40">
                    <div className="flex justify-between items-center">
                      <Label className="text-caption font-bold">Split Cost Across Projects *</Label>
                      <Button type="button" variant="outline" size="xs" onClick={() => setPurAllocs([...purAllocs, { projectId: '', amount: '' }])}>
                        <Plus className="w-2.5 h-2.5 mr-0.5" />Add Split
                      </Button>
                    </div>
                    {purAllocs.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select value={a.projectId} onChange={e => { const u = [...purAllocs]; u[i].projectId = e.target.value; setPurAllocs(u); }} className={selectStyle + ' flex-1 h-9 font-medium'}>
                          <option value="">Select project...</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                        </select>
                        <Input type="number" placeholder="LKR" value={a.amount} onChange={e => { const u = [...purAllocs]; u[i].amount = e.target.value; setPurAllocs(u); }} className="w-24 h-9" />
                        {purAllocs.length > 1 && (
                          <button type="button" onClick={() => setPurAllocs(purAllocs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-danger p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                    <Button type="button" variant="outline" onClick={() => setPurDlg(false)}>Cancel</Button>
                    <Button type="submit" disabled={createPur.isPending}>
                      {createPur.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Save Purchase'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {purLoading ? <Spinner /> : (
            <div className="space-y-3">
              {(purchases || []).map(p => {
                const CI = catIcon[p.category] || Package;
                return (
                  <div key={p.id} className="flex items-start gap-3.5 p-4 rounded-xl border border-border/30 bg-card hover:shadow-panel transition-all duration-200">
                    <div className="w-9 h-9 rounded-lg bg-accent/40 flex items-center justify-center flex-shrink-0">
                      <CI className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground">{p.title}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-caption">
                            <span>{catEmoji[p.category]} {catLabel[p.category]}</span>
                            {p.vendor && <span>• {p.vendor}</span>}
                            <span>• {new Date(p.purchaseDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-danger text-financial">{fmtFull(Number(p.totalAmount))}</span>
                          <button onClick={() => delPur.mutate(p.id)} className="text-muted-foreground hover:text-danger p-1 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {p.allocations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 border-t border-border/10 pt-2">
                          {p.allocations.map(a => (
                            <span key={a.id} className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-accent/30 px-2 py-0.5 rounded border border-border/20">
                              <span className="text-muted-foreground">{a.project?.code}</span>
                              <span className="text-muted-foreground/40">→</span>
                              <span className="text-foreground text-financial">{fmtFull(Number(a.amount))}</span>
                              <span className="text-muted-foreground/50">({Number(a.percentage).toFixed(0)}%)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!purchases || purchases.length === 0) && <EmptyState icon={ArrowUpCircle} text="No purchases logged yet" />}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 4: ASSETS ═══ */}
      {tab === 'assets' && (
        <div className="space-y-4 stagger-children">
          <div className="flex justify-between items-center gap-3">
            <span className="text-xs text-muted-foreground">Register construction equipment & portable tools.</span>
            <Dialog open={astDlg} onOpenChange={setAstDlg}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Register Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register Asset</DialogTitle>
                  <DialogDescription>Track shared tools, equipment, or machinery.</DialogDescription>
                </DialogHeader>
                {astErr && <Alert variant="destructive"><AlertDescription>{astErr}</AlertDescription></Alert>}
                <form onSubmit={astForm.handleSubmit((v) => { setAstErr(null); createAst.mutate(v); })} className="space-y-3">
                  <div>
                    <Label className="text-caption">Asset Name *</Label>
                    <Input placeholder="Concrete Mixer, Jackhammer, Drill..." {...astForm.register('name')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">Category</Label>
                      <select className={selectStyle + ' w-full h-9 font-medium'} {...astForm.register('category')}>
                        <option>Tool</option>
                        <option>Equipment</option>
                        <option>Vehicle</option>
                        <option>Safety Gear</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-caption">Price (LKR)</Label>
                      <Input type="number" {...astForm.register('purchasePrice')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">Condition</Label>
                      <select className={selectStyle + ' w-full h-9 font-medium'} {...astForm.register('condition')}>
                        <option value="NEW">New</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="POOR">Poor</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-caption">Serial Number</Label>
                      <Input {...astForm.register('serialNumber')} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                    <Button type="button" variant="outline" onClick={() => setAstDlg(false)}>Cancel</Button>
                    <Button type="submit" disabled={createAst.isPending}>
                      {createAst.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Register'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {assignId && (
            <div className="flex items-center gap-2.5 p-3.5 bg-warning-subtle/50 border border-warning/15 rounded-xl">
              <Label className="text-caption font-bold text-warning whitespace-nowrap">Assign to site:</Label>
              <select value={assignProject} onChange={e => setAssignProject(e.target.value)} className={selectStyle + ' flex-1 h-9 font-medium bg-card'}>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
              <Button size="sm" onClick={() => assignAst.mutate()} disabled={!assignProject}>Assign</Button>
              <Button size="sm" variant="ghost" onClick={() => setAssignId(null)}>Cancel</Button>
            </div>
          )}

          {astLoading ? <Spinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(assets || []).map(a => (
                <div key={a.id} className="relative rounded-xl border border-border/30 bg-card overflow-hidden hover:shadow-panel transition-all duration-200">
                  <span className={`absolute top-0 bottom-0 left-0 w-[3px] ${a.currentProject ? 'bg-warning' : 'bg-success'}`} />
                  <div className="p-4 pl-5">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-semibold text-foreground">{a.name}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${condColor[a.condition]}`}>{a.condition}</span>
                    </div>
                    <div className="flex gap-2 text-caption mb-3">
                      <span>{a.category}</span>
                      {a.serialNumber && <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{a.serialNumber}</span>}
                      <span>• {fmtFull(Number(a.purchasePrice))}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mb-4 border-t border-border/10 pt-3">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/40" />
                      {a.currentProject ? <span className="font-semibold text-warning">{a.currentProject.code} — {a.currentProject.name}</span> : <span className="text-success font-semibold">Available in Inventory</span>}
                    </div>
                    <div className="flex gap-1.5">
                      {a.currentProject && <Button size="xs" variant="outline" onClick={() => returnAst.mutate(a.id)}>Return</Button>}
                      <Button size="xs" variant="outline" className="text-warning hover:bg-warning-subtle" onClick={() => { setAssignId(a.id); setAssignProject(''); }}>
                        <ArrowRight className="w-2.5 h-2.5 mr-0.5" />Assign
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {(!assets || assets.length === 0) && <div className="col-span-full"><EmptyState icon={Wrench} text="No assets registered yet" /></div>}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 5: LEDGER ═══ */}
      {tab === 'ledger' && (
        <div className="space-y-4 stagger-children">
          <div className="flex items-center gap-2 p-3 bg-accent/20 border border-border/30 rounded-2xl">
            <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground/50" />
            <select value={ledgerProject} onChange={e => setLedgerProject(e.target.value)} className={selectStyle + ' flex-1 max-w-sm'}>
              <option value="">Choose project ledger...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </div>

          {!ledgerProject ? (
            <EmptyState icon={CircleDollarSign} text="Select a project ledger to show ledger records" />
          ) : ledLoading ? (
            <Spinner />
          ) : ledger ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-success-subtle border border-success/15">
                  <span className="text-label text-success/75 text-[9px]">Total In</span>
                  <p className="text-base font-bold text-success text-financial mt-1">{fmtFull(ledger.summary.totalIn)}</p>
                </div>
                <div className="p-4 rounded-xl bg-danger-subtle border border-danger/15">
                  <span className="text-label text-danger/75 text-[9px]">Total Out</span>
                  <p className="text-base font-bold text-danger text-financial mt-1">{fmtFull(ledger.summary.totalOut)}</p>
                </div>
                <div className={`p-4 rounded-xl border ${ledger.summary.finalBalance >= 0 ? 'bg-info-subtle border-info/15' : 'bg-danger-subtle border-danger/15'}`}>
                  <span className={`text-label text-[9px] ${ledger.summary.finalBalance >= 0 ? 'text-info/75' : 'text-danger/75'}`}>Running Balance</span>
                  <p className={`text-base font-bold text-financial mt-1 ${ledger.summary.finalBalance >= 0 ? 'text-info' : 'text-danger'}`}>{fmtFull(ledger.summary.finalBalance)}</p>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Date</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Description</th>
                          <th className="pb-3 text-right">Inflow (+)</th>
                          <th className="pb-3 text-right">Outflow (-)</th>
                          <th className="pb-3 pr-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.entries.map((e, idx) => (
                          <tr key={e.id + idx} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                            <td className="py-3.5 pl-2 text-muted-foreground whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="py-3.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${e.type === 'ADVANCE' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                {e.type === 'ADVANCE' ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td className="py-3.5 max-w-[200px]">
                              <span className="font-semibold text-foreground">{e.description}</span>
                              {e.category && <span className="text-[10px] text-muted-foreground/50 ml-1.5">({catLabel[e.category]})</span>}
                            </td>
                            <td className="py-3.5 text-right font-medium text-success text-financial">{e.amountIn > 0 ? fmtFull(e.amountIn) : '—'}</td>
                            <td className="py-3.5 text-right font-medium text-danger text-financial">{e.amountOut > 0 ? fmtFull(e.amountOut) : '—'}</td>
                            <td className={`py-3.5 pr-2 text-right font-bold text-financial ${e.runningBalance >= 0 ? 'text-info' : 'text-danger'}`}>{fmtFull(e.runningBalance)}</td>
                          </tr>
                        ))}
                        {ledger.entries.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground italic">No transactions cataloged for this project.</td></tr>}
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
            <DialogDescription>Capital inputs received from the project client.</DialogDescription>
          </DialogHeader>
          {advErr && <Alert variant="destructive"><AlertDescription>{advErr}</AlertDescription></Alert>}
          <form onSubmit={advForm.handleSubmit((v) => { setAdvErr(null); createAdv.mutate(v); })} className="space-y-3">
            <div>
              <Label className="text-caption">Project *</Label>
              <select value={advProject} onChange={e => setAdvProject(e.target.value)} className={selectStyle + ' w-full h-9 font-medium'} required>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-caption">Amount (LKR) *</Label>
                <Input type="number" placeholder="500000" {...advForm.register('amount')} />
                {advForm.formState.errors.amount && <p className="text-[10px] text-destructive mt-0.5">{advForm.formState.errors.amount.message}</p>}
              </div>
              <div>
                <Label className="text-caption">Date *</Label>
                <Input type="date" {...advForm.register('receivedDate')} />
              </div>
            </div>
            <div>
              <Label className="text-caption">Description *</Label>
              <Input placeholder="Client advance payment" {...advForm.register('description')} />
            </div>
            <div>
              <Label className="text-caption">Reference No.</Label>
              <Input placeholder="CHQ-2026-001" {...advForm.register('referenceNo')} />
            </div>
            <div>
              <Label className="text-caption">Notes</Label>
              <textarea placeholder="Notes..." className={textareaStyle} {...advForm.register('notes')} />
            </div>
            <div>
              <Label className="text-caption font-semibold text-info">Funding Source (Optional Bank Loan)</Label>
              <select className={selectStyle + ' w-full h-9 font-medium'} {...advForm.register('bankLoanId')}>
                <option value="">Direct Payment / Cash / Client</option>
                {(bankLoans || []).filter(l => l.status === 'ACTIVE').map(l => (
                  <option key={l.id} value={l.id}>{l.bankName} (Remaining: {fmt(l.balance)})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setAdvDlg(false)}>Cancel</Button>
              <Button type="submit" disabled={createAdv.isPending || !advProject}>
                {createAdv.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Save Advance'}
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
  return <div className="flex h-32 items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60" /></div>;
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-accent/10 border border-border/30 rounded-2xl text-center space-y-2">
      <Icon className="w-8 h-8 text-muted-foreground/20" />
      <p className="text-xs font-semibold text-muted-foreground">{text}</p>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, bgClass, iconColor, sub }: { label: string; value: string; icon: any; bgClass: string; iconColor: string; sub: string }) {
  return (
    <div className="glass-panel p-4 text-left hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgClass} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-base font-semibold text-foreground tracking-tight text-financial">{value}</p>
      <p className="text-[9px] font-medium text-muted-foreground mt-2">{sub}</p>
    </div>
  );
}
