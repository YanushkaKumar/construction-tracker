'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Landmark, Plus, Loader2, AlertCircle, FileCheck2, SlidersHorizontal,
  Check, X, ShieldCheck, Pencil, Trash2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FundingAllocationBuilder } from '@/components/ui/funding-allocation-builder';

interface Expense {
  id: string;
  projectId: string;
  submittedById: string;
  category: 'LABOUR' | 'MATERIAL' | 'EQUIPMENT' | 'TRANSPORT' | 'SUBCONTRACTOR' | 'MISCELLANEOUS';
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  expenseDate: string;
  createdAt: string;
  submittedBy?: { firstName: string; lastName: string };
  project?: { name: string; code: string };
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const expenseSchema = z.object({
  title: z.string().min(3, 'Expense title must be at least 3 characters'),
  category: z.enum(['LABOUR', 'MATERIAL', 'EQUIPMENT', 'TRANSPORT', 'SUBCONTRACTOR', 'MISCELLANEOUS']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const statusMeta: Record<string, { label: string; dotClass: string }> = {
  PENDING: { label: 'Pending', dotClass: 'status-paused' },
  APPROVED: { label: 'Approved', dotClass: 'status-complete' },
  PAID: { label: 'Paid', dotClass: 'status-active' },
  REJECTED: { label: 'Rejected', dotClass: 'status-critical' },
};

const categoryLabels: Record<string, string> = {
  LABOUR: 'Labour',
  MATERIAL: 'Material',
  EQUIPMENT: 'Equipment',
  TRANSPORT: 'Transport',
  SUBCONTRACTOR: 'Subcontractor',
  MISCELLANEOUS: 'Other',
};

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'ledger' | 'approvals'>('ledger');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<'LABOUR' | 'MATERIAL' | 'EQUIPMENT' | 'TRANSPORT' | 'SUBCONTRACTOR' | 'MISCELLANEOUS'>('MATERIAL');
  const [editAmount, setEditAmount] = useState(0);
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [allocations, setAllocations] = useState<{ fundingSourceId: string; amount: number }[]>([]);
  const [editAllocations, setEditAllocations] = useState<{ fundingSourceId: string; amount: number }[]>([]);
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [registerAsAsset, setRegisterAsAsset] = useState(false);

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return (await apiClient.patch(`/expenses/${id}`, values)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      setEditingExpense(null);
      setEditAllocations([]);
      setMutateError(null);
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to update expense');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/expenses/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      setDeletingExpense(null);
    }
  });

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditTitle(exp.title);
    setEditCategory(exp.category);
    setEditAmount(Number(exp.amount));
    setEditDate(new Date(exp.expenseDate).toISOString().split('T')[0]);
    setEditDescription(exp.description || '');
    setEditAllocations(
      ((exp as any).allocations || []).map((a: any) => ({
        fundingSourceId: a.fundingSourceId,
        amount: Number(a.amount)
      }))
    );
  };

  const isAuthorizer = user?.role === 'COMPANY_OWNER' || user?.role === 'PROJECT_MANAGER' || user?.role === 'ACCOUNTANT';

  // Fetch projects list
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  // Fetch ledger expenses
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery<Expense[]>({
    queryKey: ['project-expenses', selectedProjectId, projectsData?.data],
    queryFn: async () => {
      const pList = projectsData?.data || [];
      if (selectedProjectId && selectedProjectId !== 'ALL') {
        return (await apiClient.get(`/projects/${selectedProjectId}/expenses`)).data;
      }
      const allExps: Expense[] = [];
      for (const p of pList) {
        try {
          const res = await apiClient.get(`/projects/${p.id}/expenses`);
          const mapped = (res.data || []).map((e: any) => ({ ...e, project: { id: p.id, name: p.name, code: p.code } }));
          allExps.push(...mapped);
        } catch { /* skip */ }
      }
      return allExps;
    },
    retry: 1,
  });

  // Fetch pending approvals across company
  const { data: pendingData, isLoading: isPendingLoading } = useQuery<Expense[]>({
    queryKey: ['pending-expenses'],
    queryFn: async () => (await apiClient.get('/expenses/pending')).data,
    enabled: activeTab === 'approvals' && isAuthorizer,
    retry: 1,
  });

  // Submit expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (values: any) => {
      const { projectId, ...rest } = values;
      return (await apiClient.post(`/projects/${projectId}/expenses`, rest)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      setIsDialogOpen(false);
      setAllocations([]);
      setFormProjectId('');
      resetForm();
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to submit expense');
    }
  });

  // Approve expense mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.post(`/expenses/${id}/approve`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] });
    },
  });

  // Reject expense mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return (await apiClient.post(`/expenses/${id}/reject`, { reason })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] });
      setRejectingExpenseId(null);
      setRejectionReason('');
    },
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      category: 'MATERIAL' as const,
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const watchAmount = watch('amount') || 0;
  const watchCategory = watch('category');
  const projectsList = projectsData?.data || [];
  const expenses = ledgerData || [];
  const pendingApprovals = pendingData || [];

  const handleCreateExpense = (values: any) => {
    const targetProject = formProjectId || (selectedProjectId === 'ALL' ? '' : selectedProjectId);
    if (!targetProject) {
      setMutateError('Please select a specific project first to log the expense.');
      return;
    }
    
    // Check allocations total
    const totalAllocated = allocations.reduce((acc, curr) => acc + curr.amount, 0);
    if (Math.abs(totalAllocated - Number(values.amount)) > 0.01) {
      setMutateError(`Please allocate exactly LKR ${Number(values.amount).toLocaleString()} from funding sources.`);
      return;
    }

    setMutateError(null);
    createExpenseMutation.mutate({
      ...values,
      projectId: targetProject,
      allocations,
      registerAsAsset,
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleRejectSubmit = (id: string) => {
    if (!rejectionReason.trim()) return;
    rejectMutation.mutate({ id, reason: rejectionReason });
  };

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";
  const textareaStyle = "flex min-h-[60px] w-full rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 resize-none placeholder:text-muted-foreground/50 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">Operational Outflows</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Record daily project expenditures, audit payment requests, and track balances.</p>
        </div>

        {activeTab === 'ledger' && (
          <Dialog open={isDialogOpen} onOpenChange={(o) => {
            setIsDialogOpen(o);
            if (!o) {
              setAllocations([]);
              setFormProjectId('');
              setMutateError(null);
              setRegisterAsAsset(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="font-semibold h-10 rounded-xl transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                <DialogTitle className="text-sm font-bold">Log Project Expense</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">Record a physical transaction or raw material invoice.</DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-wider">Logging Error</AlertTitle>
                  <AlertDescription className="text-xs font-semibold">{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleCreateExpense)} className="space-y-4 font-semibold text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="formProjectId" className="text-xs font-semibold text-foreground/80">Project *</Label>
                  <select
                    id="formProjectId"
                    className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
                    value={formProjectId || (selectedProjectId === 'ALL' ? '' : selectedProjectId)}
                    onChange={(e) => {
                      setFormProjectId(e.target.value);
                      setAllocations([]);
                    }}
                  >
                    <option value="">Select a project...</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold text-foreground/80">Expense Title *</Label>
                  <Input id="title" placeholder="Concrete supplier invoice" {...register('title')} className={inputStyle} />
                  {errors.title && <p className="text-[10px] text-danger font-bold">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-semibold text-foreground/80">Category *</Label>
                    <select 
                      id="category" 
                      className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
                      {...register('category')}
                    >
                      <option value="MATERIAL">Material</option>
                      <option value="LABOUR">Labour</option>
                      <option value="EQUIPMENT">Equipment Rental</option>
                      <option value="TRANSPORT">Transport</option>
                      <option value="SUBCONTRACTOR">Subcontractor</option>
                      <option value="MISCELLANEOUS">Miscellaneous</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs font-semibold text-foreground/80">Amount (LKR) *</Label>
                    <Input id="amount" type="number" placeholder="50000" {...register('amount')} className={inputStyle} />
                    {errors.amount && <p className="text-[10px] text-danger font-bold">{errors.amount.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expenseDate" className="text-xs font-semibold text-foreground/80">Expense Date *</Label>
                  <Input id="expenseDate" type="date" {...register('expenseDate')} className={inputStyle} />
                  {errors.expenseDate && <p className="text-[10px] text-danger font-bold">{errors.expenseDate.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold text-foreground/80">Remarks / Description</Label>
                  <textarea 
                    id="description" 
                    placeholder="Provide details regarding the supplier invoice..."
                    {...register('description')}
                    className={textareaStyle}
                  />
                </div>

                {(watchCategory === 'EQUIPMENT' || watchCategory === 'MATERIAL') && (
                  <div className="flex items-center gap-2 py-1 select-none font-semibold">
                    <input 
                      type="checkbox" 
                      id="registerAsAsset" 
                      checked={registerAsAsset} 
                      onChange={(e) => setRegisterAsAsset(e.target.checked)}
                      className="rounded border-border/40 text-primary focus:ring-ring cursor-pointer"
                    />
                    <Label htmlFor="registerAsAsset" className="text-xs font-bold text-foreground/85 cursor-pointer">Register as Asset in company registry?</Label>
                  </div>
                )}

                {(formProjectId || selectedProjectId !== 'ALL') && (
                  <FundingAllocationBuilder
                    totalAmount={Number(watchAmount)}
                    allocations={allocations}
                    onChange={setAllocations}
                    projectId={formProjectId || selectedProjectId}
                  />
                )}

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                  <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Logging…</>
                    ) : (
                      'Log Expense'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/25 p-1 rounded-xl border border-border/25 overflow-x-auto gap-1 w-max select-none">
        {[
          { id: 'ledger', label: 'Outflows Ledger' },
          { id: 'approvals', label: 'Pending Sign-offs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`h-8.5 px-4 text-[12px] font-bold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-background border border-border/10 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="mt-4">
        {activeTab === 'ledger' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {/* Filter Panel */}
            <div className="flex items-center gap-3.5 select-none bg-accent/5 border border-border/15 p-3 rounded-2xl w-max">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter Project:
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={selectStyle}
              >
                <option value="ALL">All Projects</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>

            {isLedgerLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <Card className="glass-panel border-border/30 shadow-panel">
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[15px] text-left border-collapse font-semibold">
                      <thead>
                        <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[11px] font-mono select-none">
                          <th className="pb-2.5 pl-2">Expense Details</th>
                          <th className="pb-2.5">Category</th>
                          <th className="pb-2.5 text-right">Amount (LKR)</th>
                          <th className="pb-2.5">Transaction Date</th>
                          <th className="pb-2.5">Submitter</th>
                          <th className="pb-2.5 pr-2 text-center">Status</th>
                          <th className="pb-2.5 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((exp) => {
                          const stat = statusMeta[exp.status] || { label: exp.status, dotClass: '' };
                          const allocationsList = (exp as any).allocations || [];
                          return (
                            <tr key={exp.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                              <td className="py-3 pl-2 text-left">
                                <div className="font-bold text-foreground leading-snug">{exp.title}</div>
                                {exp.description && <div className="text-[12px] text-muted-foreground/75 font-normal leading-relaxed mt-0.5">{exp.description}</div>}
                                {allocationsList.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px]">
                                    {allocationsList.map((alloc: any) => (
                                      <span key={alloc.id} className="bg-info-subtle text-info px-1.5 py-0.5 rounded-md border border-info/25">
                                        {alloc.fundingSource?.name || 'Capital Pool'}: LKR {Number(alloc.amount).toLocaleString()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 text-muted-foreground/80 uppercase tracking-wider text-[11px] font-mono select-none">
                                {categoryLabels[exp.category] || exp.category}
                              </td>
                              <td className="py-3 text-right font-semibold text-foreground font-mono text-financial">
                                LKR {exp.amount.toLocaleString()}
                              </td>
                              <td className="py-3 text-muted-foreground/80 font-mono">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                              <td className="py-3 text-muted-foreground/80">{exp.submittedBy?.firstName} {exp.submittedBy?.lastName}</td>
                              <td className="py-3 pr-2 text-center select-none">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  <span className={`status-dot ${stat.dotClass}`} />
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{stat.label}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-2 text-right select-none">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                    onClick={() => handleOpenEdit(exp)}
                                    disabled={exp.status !== 'PENDING' && user?.role !== 'COMPANY_OWNER'}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-danger/60 hover:text-danger hover:bg-danger-subtle rounded-lg"
                                    onClick={() => setDeletingExpense(exp)}
                                    disabled={exp.status !== 'PENDING' && user?.role !== 'COMPANY_OWNER'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {expenses.length === 0 && (
                          <tr><td colSpan={7} className="py-8 text-center text-muted-foreground italic text-[15px] font-normal select-none">No project expenses found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {!isAuthorizer ? (
              <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl">
                <AlertCircle className="h-4 w-4 text-danger" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">Access Denied</AlertTitle>
                <AlertDescription className="text-xs font-semibold">Your corporate personnel profile is not authorized to sign off payouts.</AlertDescription>
              </Alert>
            ) : isPendingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none glass-panel border-border/30 rounded-2xl">
                <FileCheck2 className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
                <p className="text-sm font-bold text-foreground mb-1">No pending payouts</p>
                <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed font-sans">All procurement purchase requests have been reviewed and approved.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((exp) => (
                  <Card key={exp.id} className="relative overflow-hidden hover:shadow-panel transition-all duration-200 border-border/30 bg-card/65 backdrop-blur-xl">
                    <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-warning" />
                    <CardContent className="p-5 pl-7 space-y-4 font-semibold text-left">
                      <div>
                        <div className="flex justify-between items-baseline gap-2 mb-1 select-none">
                          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider font-mono">
                            {exp.project?.code} • {categoryLabels[exp.category] || exp.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground/60 font-mono">
                            {new Date(exp.expenseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-[18px] lg:text-[20px] font-bold text-foreground">{exp.title}</h4>
                      </div>

                      {exp.description && (
                        <p className="text-[15px] text-muted-foreground leading-relaxed font-medium">
                          {exp.description}
                        </p>
                      )}

                      <div className="flex justify-between items-baseline border-y border-border/15 py-2.5 select-none">
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider font-mono">Total Amount</span>
                        <span className="text-[20px] font-semibold text-danger text-financial font-mono">LKR {exp.amount.toLocaleString()}</span>
                      </div>

                      {/* Display allocations for approvals too */}
                      {((exp as any).allocations || []).length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider font-mono select-none">Funding Structure</span>
                          <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                            {((exp as any).allocations || []).map((alloc: any) => (
                              <span key={alloc.id} className="bg-info-subtle text-info px-1.5 py-0.5 rounded-md border border-info/25">
                                {alloc.fundingSource?.name || 'Capital Pool'}: LKR {Number(alloc.amount).toLocaleString()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[13px] border-b border-border/15 pb-3">
                        <span className="text-muted-foreground/50 font-mono text-[10px] font-bold uppercase select-none">Requested By</span>
                        <span className="text-muted-foreground font-bold">{exp.submittedBy?.firstName} {exp.submittedBy?.lastName}</span>
                      </div>

                      {rejectingExpenseId === exp.id ? (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <Label htmlFor="rejectionReason" className="text-xs font-bold text-danger">Rejection Reason</Label>
                          <Input 
                            id="rejectionReason" 
                            placeholder="Why is this payout rejected?" 
                            value={rejectionReason} 
                            onChange={e => setRejectionReason(e.target.value)} 
                            className={inputStyle}
                          />
                          <div className="flex justify-end gap-2 pt-1 select-none">
                            <Button 
                              variant="outline" 
                              onClick={() => setRejectingExpenseId(null)} 
                              className="rounded-xl h-8.5 text-[11px]"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleRejectSubmit(exp.id)} 
                              className="bg-danger hover:bg-danger/95 text-danger-foreground font-bold rounded-xl h-8.5 text-[11px]"
                              disabled={rejectMutation.isPending}
                            >
                              {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                              Confirm Rejection
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3 select-none">
                          <Button 
                            variant="ghost" 
                            onClick={() => setRejectingExpenseId(exp.id)} 
                            className="text-danger/60 hover:text-danger hover:bg-danger-subtle font-bold rounded-xl h-8.5 px-3 text-[11px]"
                            disabled={approveMutation.isPending}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject Request
                          </Button>
                          <Button 
                            onClick={() => handleApprove(exp.id)} 
                            className="bg-success-subtle text-success border border-success/20 hover:bg-success/20 font-bold rounded-xl h-8.5 px-3 text-[11px] shadow-sm"
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Edit Expense Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={(o) => {
          if(!o) {
            setEditingExpense(null);
            setMutateError(null);
            setEditAllocations([]);
          }
        }}>
          <DialogContent className="max-w-md rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
            <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
              <DialogTitle className="text-sm font-bold">Edit Expense Record</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">Modify the recorded details of this project outflow.</DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4">
                <AlertCircle className="h-4 w-4 text-danger" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">Update Error</AlertTitle>
                <AlertDescription className="text-xs font-semibold">{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingExpense) {
                const totalEditAllocated = editAllocations.reduce((acc, curr) => acc + curr.amount, 0);
                if (Math.abs(totalEditAllocated - Number(editAmount)) > 0.01) {
                  setMutateError(`Allocation total (LKR ${totalEditAllocated.toLocaleString()}) does not match expense amount (LKR ${Number(editAmount).toLocaleString()})`);
                  return;
                }
                updateExpenseMutation.mutate({
                  id: editingExpense.id,
                  values: {
                    title: editTitle,
                    category: editCategory,
                    amount: Number(editAmount),
                    expenseDate: editDate,
                    description: editDescription,
                    allocations: editAllocations
                  }
                });
              }
            }} className="space-y-4 pt-1 font-semibold text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Title *</Label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Amount (LKR) *</Label>
                  <Input type="number" value={editAmount} onChange={e => setEditAmount(Number(e.target.value))} required className={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Category *</Label>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold">
                    <option value="LABOUR">Labour</option>
                    <option value="MATERIAL">Material</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="SUBCONTRACTOR">Subcontractor</option>
                    <option value="MISCELLANEOUS">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Expense Date *</Label>
                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required className={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Description</Label>
                <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} className={inputStyle} />
              </div>

              {editingExpense && (
                <FundingAllocationBuilder
                  totalAmount={Number(editAmount)}
                  allocations={editAllocations}
                  onChange={setEditAllocations}
                  projectId={editingExpense.projectId}
                />
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15">
                <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setEditingExpense(null)}>Cancel</Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={updateExpenseMutation.isPending}>
                  {updateExpenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Expense Dialog */}
        <Dialog open={!!deletingExpense} onOpenChange={(o) => { if(!o) setDeletingExpense(null); }}>
          <DialogContent className="max-w-sm rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
            <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
              <DialogTitle className="text-sm font-bold">Delete Expense Record</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">Are you sure you want to permanently delete &quot;{deletingExpense?.title}&quot;?</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/15">
              <Button variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setDeletingExpense(null)}>Cancel</Button>
              <Button className="bg-danger text-danger-foreground hover:bg-danger/90 rounded-xl h-9 text-xs font-bold" onClick={() => {
                if (deletingExpense) {
                  deleteExpenseMutation.mutate(deletingExpense.id);
                }
              }} disabled={deleteExpenseMutation.isPending}>
                {deleteExpenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : 'Delete Record'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
