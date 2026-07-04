'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { BankLoansTab } from './components/BankLoansTab';
import {
  Wallet, TrendingDown, TrendingUp, CircleDollarSign, Banknote,
  Zap, ChevronRight, ArrowUpRight, Download, Plus, CheckCircle2,
  AlertTriangle, BarChart2, Building2, Landmark, FileText,
  RefreshCw, Loader2, AlertCircle, Coins, Sparkles, FileSpreadsheet,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar, DonutChart, LineAreaChart } from '@/components/ui/custom-charts';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { SkeletonStatGrid, SkeletonChart, SkeletonTable } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) => {
  const abs = Math.abs(n);
  const prefix = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${prefix}LKR ${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)     return `${prefix}LKR ${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)         return `${prefix}LKR ${(abs / 1_000).toFixed(0)}K`;
  return `${prefix}LKR ${abs.toLocaleString()}`;
};

const fmtNum = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ── Types ────────────────────────────────────────────────────

interface FinanceOverview {
  companyTotals: {
    totalBudget: number;
    totalAdvance: number;
    totalSpent: number;
    balance: number;
    projectCount: number;
  };
  projectBreakdown: Array<{
    id: string;
    name: string;
    code: string;
    budgetEstimate: number;
    totalAdvance: number;
    totalSpent: number;
    balance: number;
  }>;
}

interface Advance {
  [key: string]: any;
  id: string;
  projectId: string;
  receivedById?: string;
  type: string;
  amount: number;
  receivedDate: string;
  description?: string;
  source?: string;
  project: { name: string; code: string };
  receivedBy?: { firstName: string; lastName: string };
}

interface PurchaseAllocation {
  id: string;
  purchaseId: string;
  projectId: string;
  amount: number;
  percentage: number;
  notes?: string;
  project?: { id: string; name: string; code: string };
}

interface Purchase {
  [key: string]: any;
  id: string;
  description: string;
  totalAmount: number;
  purchaseDate: string;
  vendor?: string;
  receiptNo?: string;
  category?: string;
  allocations?: PurchaseAllocation[];
}

interface Asset {
  [key: string]: any;
  id: string;
  name: string;
  assetType: string;
  purchasePrice: number;
  createdAt: string;
  status: string;
  serialNumber?: string;
  assignedToProject?: { name: string };
  purchase?: {
    id: string;
    title: string;
    totalAmount: number;
    purchaseDate: string;
  };
}

interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  payDate: string;
  reference?: string;
}

interface BankLoan {
  id: string;
  lenderName: string;
  principalAmount: number;
  interestRate: number;
  startDate: string;
  endDate?: string;
  status: string;
  paidAmount: number;
  balance: number;
  payments: LoanPayment[];
}

// ── Treasury banner ───────────────────────────────────────────

function TreasuryBanner({ overview, isLoading }: { overview?: FinanceOverview; isLoading: boolean }) {
  if (isLoading) return <SkeletonStatGrid count={5} cols={5} />;
  if (!overview) return null;

  const t = overview.companyTotals;
  const burnPercent = t.totalAdvance > 0
    ? Math.min(Math.round((t.totalSpent / t.totalAdvance) * 100), 100)
    : 0;

  // Estimate days remaining (assume 60-day period)
  const dailyBurn = t.totalSpent > 0 ? Math.round(t.totalSpent / 60) : 0;
  const daysRemaining = dailyBurn > 0 ? Math.floor(t.balance / dailyBurn) : null;

  const stats = [
    {
      label: 'Total Budget',
      value: fmt(t.totalBudget),
      icon: BarChart2,
      color: 'text-muted-foreground/70',
      bg: 'bg-accent/30',
    },
    {
      label: 'Funds Received',
      value: fmt(t.totalAdvance),
      icon: CircleDollarSign,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      label: 'Total Expenditure',
      value: fmt(t.totalSpent),
      icon: TrendingDown,
      color: 'text-danger',
      bg: 'bg-danger-subtle',
    },
    {
      label: daysRemaining !== null ? 'Est. Days Left' : 'Daily Burn',
      value: daysRemaining !== null ? `~${daysRemaining} days` : fmt(dailyBurn),
      icon: Zap,
      color: daysRemaining !== null && daysRemaining < 30 ? 'text-warning' : 'text-muted-foreground/70',
      bg: daysRemaining !== null && daysRemaining < 30 ? 'bg-warning-subtle' : 'bg-accent/30',
    },
    {
      label: 'Treasury Balance',
      value: fmt(t.balance),
      icon: Banknote,
      color: t.balance >= 0 ? 'text-success' : 'text-danger',
      bg: t.balance >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle',
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="flex flex-col gap-2 p-4 bg-card border border-border/25 rounded-2xl shadow-surface text-left"
          >
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', s.bg)} aria-hidden>
                <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 font-mono leading-tight">
                {s.label}
              </span>
            </div>
            <p className={cn('text-[17px] font-bold font-mono tabular-nums leading-none', s.color)}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Burn progress */}
      <div className="bg-card border border-border/25 rounded-2xl p-4 shadow-surface text-left">
        <div className="flex items-center justify-between mb-2.5 select-none">
          <span className="text-[12px] font-bold text-muted-foreground/65">
            Cash Burn Rate
          </span>
          <span className={cn('chip', burnPercent > 90 ? 'bg-danger-subtle border-danger/25 text-danger' : burnPercent > 70 ? 'bg-warning-subtle border-warning/25 text-warning' : 'bg-success-subtle border-success/25 text-success')}>
            {burnPercent}% burned
          </span>
        </div>
        <ProgressBar value={t.totalSpent} max={t.totalAdvance || t.totalBudget || 1} height={6} />
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground/50 font-medium select-none">
          <span>LKR 0</span>
          <span>{fmt(t.totalAdvance || t.totalBudget)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Advances Tab ──────────────────────────────────────────────

function AdvancesTab() {
  const qc = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Advance[]>({
    queryKey: ['finance-advances'],
    queryFn: async () => (await apiClient.get('/advances')).data,
    retry: 1,
  });

  const { data: projectsRes } = useQuery<{ data: any[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  const advances = data ?? [];
  const projects = projectsRes?.data ?? [];

  const addAdvance = useMutation({
    mutationFn: async ({ projectId, values }: { projectId: string; values: any }) => {
      return (await apiClient.post(`/projects/${projectId}/advances`, values)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-advances'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      setIsAddOpen(false);
      setMutateError(null);
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to record advance');
    }
  });

  const columns: Column<Advance>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      width: 110,
      render: r => <span className="text-[12px] font-mono text-muted-foreground/70">{fmtDate(r.receivedDate)}</span>,
      getValue: r => r.receivedDate,
    },
    {
      key: 'project',
      header: 'Project',
      sortable: true,
      render: r => (
        <div>
          <p className="text-[13px] font-semibold">{r.project?.name}</p>
          <p className="text-[10px] font-mono text-muted-foreground/50">{r.project?.code}</p>
        </div>
      ),
      getValue: r => r.project?.name ?? '',
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: r => <StatusBadge status={r.type} size="sm" />,
      getValue: r => r.type,
    },
    {
      key: 'source',
      header: 'Source',
      render: r => <span className="text-[13px] text-muted-foreground/80">{r.source ?? '—'}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: r => <span className="text-[13px] text-muted-foreground/80 max-w-[200px] truncate block">{r.description ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: r => (
        <span className="text-[13px] font-bold font-mono text-success">+{fmt(r.amount)}</span>
      ),
      getValue: r => r.amount,
    },
  ];

  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 text-left">
      <div className="flex justify-between items-center bg-card/65 backdrop-blur-xl p-4 rounded-2xl border border-border/25 shadow-surface select-none">
        <div>
          <h2 className="text-[16px] lg:text-[18px] font-bold text-foreground flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-success" />
            Project Mobilization Advances
          </h2>
          <p className="text-[12px] text-muted-foreground font-semibold mt-0.5">Track and record capital inflows received from clients for active projects.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold h-9 px-3.5 rounded-xl text-xs transition-all shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Advance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
            <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
              <DialogTitle className="text-sm font-bold">Record Mobilization Advance</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">Add a new cash inflow received from a client for a project.</DialogDescription>
            </DialogHeader>
            {mutateError && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{mutateError}</AlertDescription></Alert>}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setMutateError(null);
              const data = new FormData(e.currentTarget);
              const pId = data.get('projectId') as string;
              const values = {
                amount: Number(data.get('amount')),
                description: data.get('description'),
                referenceNo: data.get('referenceNo'),
                receivedDate: data.get('receivedDate'),
              };
              if (!pId) {
                setMutateError('Please select a project');
                return;
              }
              addAdvance.mutate({ projectId: pId, values });
            }} className="space-y-4 pt-1 font-semibold text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Project *</Label>
                <select name="projectId" required className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold">
                  <option value="">Select a project...</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Amount (LKR) *</Label>
                  <Input type="number" name="amount" required className={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Reference / Cheque No. *</Label>
                  <Input name="referenceNo" placeholder="e.g. CHQ-9981" required className={inputStyle} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Received Date *</Label>
                <Input type="date" name="receivedDate" defaultValue={new Date().toISOString().split('T')[0]} required className={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Description</Label>
                <Input name="description" placeholder="Mobilization advance, milestone payment, etc." className={inputStyle} />
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15">
                <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={addAdvance.isPending}>
                  {addAdvance.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : 'Record Advance'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={advances}
        columns={columns}
        keyField="id"
        loading={isLoading}
        searchable
        searchPlaceholder="Search advances…"
        paginated
        pageSize={15}
        exportable
        density="comfortable"
        caption="Advances and fund receipts"
      />
    </div>
  );
}

// ── Purchases Tab ─────────────────────────────────────────────

function PurchasesTab() {
  const { data, isLoading } = useQuery<Purchase[]>({
    queryKey: ['finance-purchases'],
    queryFn: async () => (await apiClient.get('/purchases')).data,
    retry: 1,
  });

  const purchases = data ?? [];

  const columns: Column<Purchase>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      width: 110,
      render: r => <span className="text-[12px] font-mono text-muted-foreground/70">{fmtDate(r.purchaseDate)}</span>,
      getValue: r => r.purchaseDate,
    },
    {
      key: 'project',
      header: 'Project Allocations',
      render: r => {
        if (!r.allocations || r.allocations.length === 0) return <span className="text-muted-foreground/50">—</span>;
        return (
          <div className="space-y-0.5">
            {r.allocations.map(a => (
              <div key={a.id} className="text-[11px] leading-tight">
                <span className="font-semibold text-foreground/85">{a.project?.name}</span>
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-1">({a.project?.code}) - {a.percentage}%</span>
              </div>
            ))}
          </div>
        );
      },
      getValue: r => r.allocations?.map(a => a.project?.name).join(', ') ?? '',
    },
    {
      key: 'funding',
      header: 'Funding Sources',
      render: r => {
        const fallocs = (r as any).fundingAllocations || [];
        if (fallocs.length === 0) return <span className="text-muted-foreground/50">—</span>;
        return (
          <div className="space-y-0.5">
            {fallocs.map((fa: any) => (
              <div key={fa.id} className="text-[11px] leading-tight">
                <span className="font-semibold text-indigo-400">{fa.fundingSource?.name}</span>
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-1">({fmt(fa.amount)})</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: r => <span className="text-[13px] text-foreground/80 block max-w-[220px] truncate">{r.description}</span>,
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: r => <span className="text-[13px] text-muted-foreground/80">{r.vendor ?? '—'}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: r => r.category
        ? <StatusBadge status={r.category} size="sm" />
        : <span className="text-muted-foreground/50">—</span>,
      getValue: r => r.category ?? '',
    },
    {
      key: 'receiptNo',
      header: 'Receipt',
      render: r => <span className="text-[12px] font-mono text-muted-foreground/60">{r.receiptNo ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: r => (
        <span className="text-[13px] font-bold font-mono text-danger">{fmt(r.totalAmount)}</span>
      ),
      getValue: r => r.totalAmount,
    },
  ];

  return (
    <DataTable
      data={purchases}
      columns={columns}
      keyField="id"
      loading={isLoading}
      searchable
      searchPlaceholder="Search purchases…"
      paginated
      pageSize={15}
      exportable
      density="comfortable"
      caption="Site purchases and expenditures"
    />
  );
}

// ── Assets Tab ────────────────────────────────────────────────

function AssetsTab() {
  const { data, isLoading } = useQuery<Asset[]>({
    queryKey: ['finance-assets'],
    queryFn: async () => (await apiClient.get('/assets')).data,
    retry: 1,
  });

  const assets = data ?? [];

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset Name',
      sortable: true,
      render: r => (
        <div>
          <p className="text-[13px] font-semibold">{r.name}</p>
          {r.serialNumber && (
            <p className="text-[10px] font-mono text-muted-foreground/50">{r.serialNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: 'assetType',
      header: 'Type',
      sortable: true,
      render: r => <StatusBadge status={r.assetType ?? 'GENERAL'} size="sm" />,
      getValue: r => r.assetType,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: r => <StatusBadge status={r.status} size="sm" />,
      getValue: r => r.status,
    },
    {
      key: 'assignedToProject',
      header: 'Assigned To',
      render: r => <span className="text-[13px] text-muted-foreground/80">{r.assignedToProject?.name ?? '—'}</span>,
    },
    {
      key: 'purchaseDate',
      header: 'Purchased',
      sortable: true,
      render: r => <span className="text-[12px] font-mono text-muted-foreground/70">{fmtDate(r.purchase?.purchaseDate ?? r.createdAt)}</span>,
      getValue: r => r.purchase?.purchaseDate ?? r.createdAt,
    },
    {
      key: 'funding',
      header: 'Funding Sources',
      render: r => {
        const fallocs = (r as any).fundingAllocations || [];
        if (fallocs.length === 0) return <span className="text-muted-foreground/50">—</span>;
        return (
          <div className="space-y-0.5">
            {fallocs.map((fa: any) => (
              <div key={fa.id} className="text-[11px] leading-tight font-semibold">
                <span className="text-indigo-400">{fa.fundingSource?.name}</span>
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-1">({fmt(fa.amount)})</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'purchaseValue',
      header: 'Value',
      align: 'right',
      sortable: true,
      render: r => <span className="text-[13px] font-bold font-mono">{fmt(r.purchasePrice)}</span>,
      getValue: r => r.purchasePrice,
    },
  ];

  return (
    <DataTable
      data={assets}
      columns={columns}
      keyField="id"
      loading={isLoading}
      searchable
      searchPlaceholder="Search assets…"
      paginated
      pageSize={15}
      exportable
      density="comfortable"
      caption="Company asset registry"
    />
  );
}

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Principal',  value: fmt(loan.principalAmount), color: 'text-foreground/80' },
                { label: 'Paid',       value: fmt(loan.paidAmount), color: 'text-success' },
                { label: 'Balance',    value: fmt(loan.balance), color: loan.balance > 0 ? 'text-danger' : 'text-success' },
                { label: 'Paid %',     value: `${paidPercent}%`, color: paidPercent >= 100 ? 'text-success' : 'text-muted-foreground/80' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-accent/20 rounded-xl border border-border/15">
                  <p className={cn('text-[16px] font-bold font-mono', s.color)}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 text-[12px] font-semibold text-muted-foreground/60">
                <span>Repayment Progress</span>
                <span className="font-mono">{paidPercent}%</span>
              </div>
              <ProgressBar value={paidPercent} height={5} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Project Ledger Tab ────────────────────────────────────────

function LedgerTab({ overview }: { overview?: FinanceOverview }) {
  if (!overview) return <SkeletonTable rows={5} cols={6} />;

  const projects = overview.projectBreakdown ?? [];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/25 bg-card shadow-surface">
      <table className="w-full text-left" aria-label="Project ledger">
        <thead>
          <tr className="border-b border-border/20 bg-accent/20">
            {['Project', 'Budget', 'Advances', 'Spent', 'Balance', 'Burn %'].map(h => (
              <th
                key={h}
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const burnP = p.totalAdvance > 0
              ? Math.min(Math.round((p.totalSpent / p.totalAdvance) * 100), 100)
              : 0;
            return (
              <tr key={p.id} className="border-b border-border/10 last:border-0 hover:bg-accent/20 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-[13px] font-semibold text-foreground/90">{p.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/45">{p.code}</p>
                </td>
                <td className="px-5 py-4 text-[13px] font-mono text-foreground/80">{fmt(p.budgetEstimate)}</td>
                <td className="px-5 py-4 text-[13px] font-mono text-success font-semibold">+{fmt(p.totalAdvance)}</td>
                <td className="px-5 py-4 text-[13px] font-mono text-danger font-semibold">{fmt(p.totalSpent)}</td>
                <td className={cn('px-5 py-4 text-[13px] font-bold font-mono', p.balance >= 0 ? 'text-success' : 'text-danger')}>
                  {fmt(p.balance)}
                </td>
                <td className="px-5 py-4 w-36">
                  <div className="flex items-center gap-2.5">
                    <ProgressBar value={burnP} max={100} height={4} color={burnP > 90 ? 'oklch(0.60 0.20 22)' : undefined} />
                    <span className={cn('text-[11px] font-bold font-mono flex-shrink-0', burnP > 90 ? 'text-danger' : 'text-muted-foreground/70')}>
                      {burnP}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab configuration ─────────────────────────────────────────

type TabId = 'overview' | 'wallets' | 'allocations' | 'purchases' | 'expenses' | 'assets' | 'loans' | 'forecast' | 'audit';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'overview',    label: 'Overview',      icon: BarChart2,         description: 'Cash flow and burn rates' },
  { id: 'wallets',     label: 'Funding Wallets', icon: Coins,            description: 'Capital source pools' },
  { id: 'allocations', label: 'Allocations Matrix', icon: FileSpreadsheet, description: 'Cross-project split matrices' },
  { id: 'purchases',   label: 'Purchases',     icon: TrendingDown,      description: 'Material purchases' },
  { id: 'expenses',    label: 'Expenses',      icon: CircleDollarSign,  description: 'Field operation expenses' },
  { id: 'assets',      label: 'Assets',        icon: Building2,         description: 'Company asset registry' },
  { id: 'loans',       label: 'Bank Loans',    icon: Landmark,          description: 'Loan repayment schedules' },
  { id: 'forecast',    label: 'Forecast',      icon: Zap,               description: 'Capital burn forecast' },
  { id: 'audit',       label: 'Audit Trail',   icon: FileText,          description: 'Journal ledger' },
];

// ── Funding Wallets Tab ───────────────────────────────────────

function FundingDashboardTab() {
  const qc = useQueryClient();
  const [isInjectOpen, setIsInjectOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['funding-dashboard'],
    queryFn: async () => (await apiClient.get('/funding-sources/dashboard')).data,
    retry: 1,
  });

  const injectCapital = useMutation({
    mutationFn: async (values: any) => {
      return (await apiClient.post('/funding-sources', values)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funding-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      setIsInjectOpen(false);
      setMutateError(null);
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to inject capital');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonStatGrid count={4} cols={4} />
        <SkeletonChart height={280} />
      </div>
    );
  }

  const db = data || { currentCash: 0, availableAdvances: 0, loans: 0, companyFunds: 0, sources: [], timeline: [], insights: [] };

  const selectedWallet = db.sources.find((s: any) => s.id === selectedWalletId) || db.sources[0];

  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Wallets Registry list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center bg-card/65 backdrop-blur-xl p-4 rounded-2xl border border-border/25 shadow-surface select-none">
            <div className="text-left">
              <h3 className="text-[15px] font-bold text-foreground">Operational Wallets</h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Liquid capital reservoirs backing operations.</p>
            </div>
            <Dialog open={isInjectOpen} onOpenChange={setIsInjectOpen}>
              <DialogTrigger asChild>
                <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold h-9 px-3.5 rounded-xl text-xs shadow-sm">
                  <Plus className="w-4 h-4 mr-1.5" /> Inject Capital
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
                <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                  <DialogTitle className="text-sm font-bold">Manual Capital Injection</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">Inject cash flow from previous profits or owner investments.</DialogDescription>
                </DialogHeader>

                {mutateError && (
                  <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{mutateError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setMutateError(null);
                  const formEl = e.currentTarget;
                  const fd = new FormData(formEl);
                  injectCapital.mutate({
                    name: fd.get('name'),
                    type: fd.get('type'),
                    amount: Number(fd.get('amount')),
                  });
                }} className="space-y-4 pt-1 font-semibold text-left">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Source Name *</Label>
                    <Input name="name" placeholder="e.g. FY2026 Profit Reinvestment" required className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Type *</Label>
                      <select name="type" required className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-2 py-1.5 text-xs outline-none font-semibold">
                        <option value="COMPANY_CASH">Company Cash</option>
                        <option value="OWNER_CAPITAL">Owner Capital</option>
                        <option value="SUPPLIER_CREDIT">Supplier Credit</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Amount (LKR) *</Label>
                      <Input type="number" name="amount" required className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none font-semibold" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15">
                    <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setIsInjectOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={injectCapital.isPending}>
                      {injectCapital.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : 'Inject Fund'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.sources.map((source: any) => {
              const utilPercent = source.originalAmount > 0
                ? Math.min(Math.round(((source.originalAmount - source.currentBalance) / source.originalAmount) * 100), 100)
                : 0;
              const isSelected = selectedWallet?.id === source.id;

              return (
                <Card
                  key={source.id}
                  onClick={() => setSelectedWalletId(source.id)}
                  className={cn(
                    'cursor-pointer border text-left transition-all hover:shadow-md duration-200 rounded-2xl',
                    isSelected ? 'border-foreground shadow-surface ring-1 ring-foreground' : 'border-border/25 shadow-surface'
                  )}
                >
                  <CardContent className="p-4 space-y-3.5">
                    <div className="flex justify-between items-start font-semibold">
                      <div>
                        <h4 className="text-xs font-bold text-foreground/90">{source.name}</h4>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground/60">{source.type.replace('_', ' ')}</span>
                      </div>
                      <span className={cn(
                        'chip font-mono text-[9px]',
                        source.currentBalance === 0 ? 'bg-danger-subtle border-danger/25 text-danger' :
                        utilPercent > 80 ? 'bg-warning-subtle border-warning/25 text-warning' :
                        'bg-success-subtle border-success/25 text-success'
                      )}>
                        {source.currentBalance === 0 ? 'Depleted' : 'Active'}
                      </span>
                    </div>

                    <div className="space-y-1 select-none">
                      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground/75 font-mono">
                        <span>Balance: {fmt(source.currentBalance)}</span>
                        <span>{utilPercent}% Utilized</span>
                      </div>
                      <ProgressBar value={utilPercent} max={100} height={4} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Wallet Timeline Flow History */}
        <div className="lg:col-span-4">
          <Card className="glass-panel border-border/25 shadow-surface text-left">
            <CardContent className="p-5 space-y-4">
              <div className="border-b border-border/15 pb-3 select-none">
                <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Wallet Flow Timeline</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{selectedWallet?.name || 'No wallet selected'}</p>
              </div>

              {selectedWallet ? (
                <div className="relative pl-5 border-l border-border/25 space-y-5 py-1">
                  {/* Start Node */}
                  <div className="relative text-xs font-semibold">
                    <span className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-success ring-4 ring-card" />
                    <p className="text-success font-bold font-mono">+{fmt(selectedWallet.originalAmount)}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Capital Drawn / Initialized</p>
                  </div>

                  {/* Allocation deductions nodes */}
                  {selectedWallet.allocations && selectedWallet.allocations.map((alloc: any) => (
                    <div key={alloc.id} className="relative text-xs font-semibold">
                      <span className="absolute -left-[25px] w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-card" />
                      <p className="text-foreground/90 font-bold font-mono">-{fmt(alloc.amount)}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{alloc.title}</p>
                    </div>
                  ))}

                  {/* End Balance Node */}
                  <div className="relative text-xs font-semibold pt-1 border-t border-border/10">
                    <span className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-foreground ring-4 ring-card" />
                    <p className="text-foreground font-bold font-mono">{fmt(selectedWallet.currentBalance)}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Current Available runway</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-semibold py-8 text-center select-none">Select a wallet to load history flow.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Money Allocations Tab (Allocations Cross-Matrix) ────────

function MoneyAllocationsMatrixTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['funding-dashboard'],
    queryFn: async () => (await apiClient.get('/funding-sources/dashboard')).data,
    retry: 1,
  });

  if (isLoading) return <SkeletonTable rows={4} cols={5} />;

  const matrix = data?.allocationMatrix ?? [];

  if (matrix.length === 0) {
    return (
      <div className="p-5 bg-card border border-border/25 rounded-2xl shadow-surface text-center font-semibold text-xs text-muted-foreground">
        No active funding allocations mapped across projects.
      </div>
    );
  }

  // Find unique project names mapped in matrix
  const projectHeaders = Array.from(new Set(matrix.flatMap((row: any) => row.projects.map((p: any) => p.name)))) as string[];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/25 bg-card shadow-surface text-left animate-in slide-in-from-bottom-2 duration-300">
      <table className="w-full text-left font-semibold text-xs">
        <thead>
          <tr className="border-b border-border/20 bg-accent/20">
            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Funding Source</th>
            {projectHeaders.map((name) => (
              <th key={name} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 text-right">{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row: any) => (
            <tr key={row.sourceId} className="border-b border-border/10 last:border-0 hover:bg-accent/20 transition-colors">
              <td className="px-5 py-4 font-bold text-foreground">{row.sourceName}</td>
              {projectHeaders.map((pName) => {
                const match = row.projects.find((p: any) => p.name === pName);
                return (
                  <td key={pName} className="px-5 py-4 text-right font-mono font-bold text-muted-foreground/80">
                    {match ? fmt(match.amount) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Expenses Sub-Tab ──────────────────────────────────────────

function ExpensesSubTab() {
  const { data: list, isLoading } = useQuery<any[]>({
    queryKey: ['expenses-list-moneycenter'],
    queryFn: async () => (await apiClient.get('/expenses')).data,
    retry: 1,
  });

  if (isLoading) return <SkeletonTable rows={5} cols={5} />;
  if (!list || list.length === 0) {
    return (
      <div className="p-5 bg-card border border-border/25 rounded-2xl shadow-surface text-center font-semibold text-xs text-muted-foreground">
        No operational expenses logged.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/25 bg-card shadow-surface text-left animate-in slide-in-from-bottom-2 duration-300">
      <table className="w-full text-left font-semibold text-xs">
        <thead>
          <tr className="border-b border-border/20 bg-accent/20">
            {['Date', 'Title', 'Category', 'Project Beneficiary', 'Amount', 'Status'].map(h => (
              <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((e: any) => (
            <tr key={e.id} className="border-b border-border/10 last:border-0 hover:bg-accent/20 transition-colors">
              <td className="px-5 py-4 text-muted-foreground font-mono">{new Date(e.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td className="px-5 py-4 font-bold text-foreground">{e.title}</td>
              <td className="px-5 py-4 text-muted-foreground uppercase tracking-wider text-[9px] font-mono">{e.category}</td>
              <td className="px-5 py-4 font-semibold text-foreground/80">{e.project?.name || 'General'}</td>
              <td className="px-5 py-4 font-mono font-bold text-foreground">{fmt(Number(e.amount))}</td>
              <td className="px-5 py-4">
                <span className={cn(
                  'chip font-mono text-[9px]',
                  e.status === 'APPROVED' ? 'bg-success-subtle border-success/25 text-success' :
                  e.status === 'PENDING' ? 'bg-warning-subtle border-warning/25 text-warning' :
                  'bg-danger-subtle border-danger/25 text-danger'
                )}>
                  {e.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Forecast Tab (Burn Forecast Curves) ─────────────────────────

function ForecastTab() {
  const { data: overview } = useQuery<any>({
    queryKey: ['finance-overview'],
    queryFn: async () => (await apiClient.get('/finance/overview')).data,
  });

  const totals = overview?.companyTotals;
  const balanceVal = totals?.balance ?? 0;
  const spentVal = totals?.totalSpent ?? 0;

  // Assume rolling 60 days burn rate
  const dailyBurn = spentVal ? Math.round(spentVal / 60) : 0;
  const daysRemaining = dailyBurn > 0 ? Math.floor(balanceVal / dailyBurn) : null;

  const forecastData = useMemo(() => {
    const data = [];
    const months = ['Current', 'Month 1', 'Month 2', 'Month 3', 'Month 4'];
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mName = date.toLocaleDateString('en-US', { month: 'short' });
      const estBalance = Math.max(0, balanceVal - (dailyBurn * 30 * i));
      data.push({
        name: i === 0 ? `${mName} (Current)` : `${mName} (Est)`,
        balance: estBalance,
      });
    }
    return data;
  }, [balanceVal, dailyBurn]);

  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300 text-left">
      <Card className="glass-panel border-border/25 shadow-surface">
        <CardContent className="p-5 font-semibold">
          <div className="flex justify-between items-center mb-4 select-none">
            <div>
              <h3 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Capital Runway Depletion Curve</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Forecast balance over next 120 days based on rolling costs.</p>
            </div>
            {daysRemaining !== null && (
              <span className={cn('chip font-mono text-xs', daysRemaining < 30 ? 'bg-danger-subtle border-danger/25 text-danger' : 'bg-success-subtle border-success/25 text-success')}>
                Runway: ~{daysRemaining} Days
              </span>
            )}
          </div>
          <div className="h-[200px] w-full flex items-center justify-center">
            <LineAreaChart
              data={forecastData}
              xAxisKey="name"
              series={[{ key: 'balance', name: 'Estimated Treasury', color: '#6366F1' }]}
              viewHeight={200}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Audit Trail Tab (Journal Logs) ──────────────────────────────

function AuditTrailTab() {
  const { data: list, isLoading } = useQuery<any[]>({
    queryKey: ['expenses-list-audit'],
    queryFn: async () => (await apiClient.get('/expenses')).data,
    retry: 1,
  });

  if (isLoading) return <SkeletonTable rows={5} cols={5} />;

  // Filter approved ones for official audit logs
  const auditLogs = list?.filter(e => e.status === 'APPROVED' || e.status === 'PAID') ?? [];

  if (auditLogs.length === 0) {
    return (
      <div className="p-5 bg-card border border-border/25 rounded-2xl shadow-surface text-center font-semibold text-xs text-muted-foreground">
        No reconciled journal entries available in the audit trail.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/25 bg-card shadow-surface text-left animate-in slide-in-from-bottom-2 duration-300">
      <table className="w-full text-left font-semibold text-xs">
        <thead>
          <tr className="border-b border-border/20 bg-accent/20">
            {['Journal Date', 'Reference ID', 'Beneficiary Project', 'Category', 'Amount Reconciled'].map(h => (
              <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {auditLogs.map((log: any) => (
            <tr key={log.id} className="border-b border-border/10 last:border-0 hover:bg-accent/20 transition-colors">
              <td className="px-5 py-4 text-muted-foreground font-mono">{new Date(log.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td className="px-5 py-4 font-mono font-bold text-indigo-400">JNL-{log.id.substring(0, 8).toUpperCase()}</td>
              <td className="px-5 py-4 font-semibold text-foreground/80">{log.project?.name || 'General'}</td>
              <td className="px-5 py-4 text-muted-foreground uppercase text-[9px] font-mono">{log.category}</td>
              <td className="px-5 py-4 font-mono font-bold text-success">-{fmt(Number(log.amount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery<FinanceOverview>({
    queryKey: ['finance-overview'],
    queryFn: async () => (await apiClient.get('/finance/overview')).data,
    retry: 1,
    staleTime: 30_000,
  });

  const breakdown = overviewData?.projectBreakdown ?? [];
  const totals = overviewData?.companyTotals;

  const expenseCategoryData = useMemo(() => {
    if (!breakdown.length) return [];
    return breakdown.map(p => ({
      label: p.code,
      value: p.totalSpent,
      color: `oklch(${0.55 + Math.random() * 0.15} 0.16 ${200 + Math.random() * 100})`,
    }));
  }, [breakdown]);

  return (
    <div className="space-y-5 pb-12 text-left" aria-label="Finance — Treasury">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="select-none">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground/90">
            Treasury &amp; Money Center
          </h1>
          <p className="text-[13px] text-muted-foreground/65 mt-0.5 font-medium">
            Central financial operations, smart cash flow tracking, and allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" aria-hidden />
            Export Data
          </Button>
        </div>
      </div>

      {/* Treasury KPI banner */}
      <TreasuryBanner overview={overviewData} isLoading={isOverviewLoading} />

      {/* Tabs */}
      <div className="border-b border-border/20">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-thin">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all duration-200 flex-shrink-0',
                  activeTab === tab.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground/60 hover:text-foreground/80 hover:border-border'
                )}
                aria-selected={activeTab === tab.id}
                role="tab"
                aria-controls={`tab-panel-${tab.id}`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div id={`tab-panel-${activeTab}`} role="tabpanel" aria-label={TABS.find(t => t.id === activeTab)?.label}>
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: project ledger summary */}
            <div className="lg:col-span-8 space-y-4">
              {isOverviewLoading
                ? <SkeletonTable rows={5} cols={5} />
                : <LedgerTab overview={overviewData} />
              }
            </div>

            {/* Right: donut chart */}
            <div className="lg:col-span-4">
              <Card className="glass-panel border-border/25 shadow-surface h-full">
                <CardContent className="p-5">
                  {expenseCategoryData.length > 0 ? (
                    <DonutChart
                      data={expenseCategoryData}
                      title="Spend by Project"
                      subtitle="total expenditure"
                      isCurrency
                    />
                  ) : isOverviewLoading ? (
                    <SkeletonChart height={200} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground/50 select-none">
                      <BarChart2 className="w-8 h-8 mb-3" aria-hidden />
                      <p className="text-[13px] font-semibold">No spend data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'wallets'     && <FundingDashboardTab />}
        {activeTab === 'allocations' && <MoneyAllocationsMatrixTab />}
        {activeTab === 'purchases'   && <PurchasesTab />}
        {activeTab === 'expenses'    && <ExpensesSubTab />}
        {activeTab === 'assets'      && <AssetsTab />}
        {activeTab === 'loans'       && <BankLoansTab />}
        {activeTab === 'forecast'    && <ForecastTab />}
        {activeTab === 'audit'       && <AuditTrailTab />}
      </div>
    </div>
  );
}
