'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Landmark, Plus, Loader2, AlertCircle, FileCheck2, SlidersHorizontal,
  Check, X, ShieldCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    mutationFn: async (values: ExpenseFormValues) => {
      return (await apiClient.post(`/projects/${selectedProjectId}/expenses`, values)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      setIsDialogOpen(false);
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

  const projectsList = projectsData?.data || [];
  const expenses = ledgerData || [];
  const pendingApprovals = pendingData || [];

  const handleCreateExpense = (values: any) => {
    if (selectedProjectId === 'ALL') {
      setMutateError('Please select a specific project first to log the expense.');
      return;
    }
    setMutateError(null);
    createExpenseMutation.mutate(values);
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleRejectSubmit = (id: string) => {
    if (!rejectionReason.trim()) return;
    rejectMutation.mutate({ id, reason: rejectionReason });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Expenses Ledger</h1>
          <p className="text-caption mt-1">Track expenditures, upload invoice statements, and authorize payouts.</p>
        </div>

        {activeTab === 'ledger' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Purchase Expense</DialogTitle>
                <DialogDescription>Record site expenses and upload receipt logs.</DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleCreateExpense)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-caption">Expense Title *</Label>
                  <Input id="title" placeholder="Concrete supplier invoice" {...register('title')} />
                  {errors.title && <p className="text-[10px] text-destructive font-medium">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-caption">Category *</Label>
                    <select 
                      id="category" 
                      className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-medium"
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
                    <Label htmlFor="amount" className="text-caption">Amount (LKR) *</Label>
                    <Input id="amount" type="number" placeholder="50000" {...register('amount')} />
                    {errors.amount && <p className="text-[10px] text-destructive font-medium">{errors.amount.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expenseDate" className="text-caption">Expense Date *</Label>
                  <Input id="expenseDate" type="date" {...register('expenseDate')} />
                  {errors.expenseDate && <p className="text-[10px] text-destructive font-medium">{errors.expenseDate.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-caption">Remarks / Description</Label>
                  <textarea 
                    id="description" 
                    placeholder="Provide details regarding the supplier invoice..."
                    rows={3}
                    className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 resize-none placeholder:text-muted-foreground/60"
                    {...register('description')}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Logging…</>
                    ) : (
                      'Log Purchase'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
        {[
          { id: 'ledger', label: 'Financial Ledger', icon: Landmark },
          { id: 'approvals', label: `Pending Approvals (${pendingApprovals.length})`, icon: ShieldCheck }
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

      {/* Tab Panel */}
      <div className="pt-2">
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-3 p-4 bg-accent/20 border border-border/30 rounded-2xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-label text-muted-foreground/60 whitespace-nowrap">Select Project</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="max-w-xs h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold"
              >
                <option value="ALL">All Demo Expenses</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {isLedgerLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Expense Details</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3 text-right">Amount (LKR)</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Submitter</th>
                          <th className="pb-3 pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((exp) => {
                          const stat = statusMeta[exp.status] || { label: exp.status, dotClass: '' };
                          return (
                            <tr key={exp.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                              <td className="py-3.5 pl-2 text-left">
                                <div className="font-semibold text-foreground">{exp.title}</div>
                                {exp.description && <span className="text-[10px] text-muted-foreground/60 font-medium">{exp.description}</span>}
                              </td>
                              <td className="py-3.5 text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">
                                {categoryLabels[exp.category] || exp.category}
                              </td>
                              <td className="py-3.5 text-right font-semibold text-foreground text-financial">
                                LKR {exp.amount.toLocaleString()}
                              </td>
                              <td className="py-3.5 text-muted-foreground">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                              <td className="py-3.5 text-muted-foreground">{exp.submittedBy?.firstName} {exp.submittedBy?.lastName}</td>
                              <td className="py-3.5 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`status-dot ${stat.dotClass}`} />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{stat.label}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {expenses.length === 0 && (
                          <tr><td colSpan={6} className="py-8 text-center text-muted-foreground italic">No expenses found.</td></tr>
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
          <div className="space-y-4">
            {!isAuthorizer ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>Your role does not have authorization to approve expenses.</AlertDescription>
              </Alert>
            ) : isPendingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileCheck2 className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-title text-foreground mb-1">No pending approvals</p>
                <p className="text-caption">All logged expenses have been processed successfully.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((exp) => (
                  <Card key={exp.id} className="relative overflow-hidden hover:shadow-panel transition-all duration-200">
                    <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-warning" />
                    <CardContent className="p-5 pl-7 space-y-4">
                      <div>
                        <div className="flex justify-between items-baseline gap-2 mb-1">
                          <span className="text-label text-muted-foreground/50 text-[9px]">
                            {exp.project?.code} • {categoryLabels[exp.category] || exp.category}
                          </span>
                          <span className="text-caption font-medium text-muted-foreground">
                            {new Date(exp.expenseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground">{exp.title}</h4>
                      </div>

                      {exp.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                          {exp.description}
                        </p>
                      )}

                      <div className="flex justify-between items-baseline border-y border-border/20 py-2.5">
                        <span className="text-label text-muted-foreground/50 text-[9px]">Total Amount</span>
                        <span className="text-sm font-bold text-danger text-financial">LKR {exp.amount.toLocaleString()}</span>
                      </div>

                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        <span>Submitted by: <strong className="text-foreground/80 font-semibold">{exp.submittedBy?.firstName} {exp.submittedBy?.lastName}</strong></span>
                      </div>

                      {rejectingExpenseId === exp.id ? (
                        <div className="space-y-2.5 pt-3 border-t border-border/20">
                          <Label htmlFor="rejectReason" className="text-caption">Reason for Rejection *</Label>
                          <Input 
                            id="rejectReason" 
                            placeholder="e.g. Budget limit exceeded, check invoice" 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end pt-1">
                            <Button variant="ghost" size="sm" onClick={() => setRejectingExpenseId(null)} disabled={rejectMutation.isPending}>
                              Cancel
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleRejectSubmit(exp.id)} disabled={rejectMutation.isPending || !rejectionReason.trim()}>
                              {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Confirm Reject'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end pt-3 border-t border-border/20">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setRejectingExpenseId(exp.id)} 
                            disabled={approveMutation.isPending}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleApprove(exp.id)} 
                            className="bg-success-subtle text-success border border-success/15 hover:bg-success/20 font-semibold"
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
      </div>
    </div>
  );
}
