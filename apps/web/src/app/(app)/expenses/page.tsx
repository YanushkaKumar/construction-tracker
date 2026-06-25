'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Landmark, 
  Plus, 
  Loader2, 
  AlertCircle,
  FileCheck2,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  FolderDot,
  Check,
  X,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data;
    },
    retry: 1,
  });

  // Fetch ledger expenses
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery<Expense[]>({
    queryKey: ['project-expenses', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL' || selectedProjectId === '') return [];
      const response = await apiClient.get(`/projects/${selectedProjectId}/expenses`);
      return response.data;
    },
    enabled: selectedProjectId !== 'ALL',
    retry: 1,
  });

  // Fetch pending approvals across company
  const { data: pendingData, isLoading: isPendingLoading } = useQuery<Expense[]>({
    queryKey: ['pending-expenses'],
    queryFn: async () => {
      const response = await apiClient.get('/expenses/pending');
      return response.data;
    },
    enabled: activeTab === 'approvals' && isAuthorizer,
    retry: 1,
  });

  // Submit expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const response = await apiClient.post(`/projects/${selectedProjectId}/expenses`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      const response = await apiClient.post(`/expenses/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Reject expense mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.post(`/expenses/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  // Mock data fallbacks for preview
  const mockLedger: Expense[] = [
    {
      id: 'exp1',
      projectId: 'prj1',
      submittedById: 'eng',
      category: 'MATERIAL',
      title: 'Cement purchase - 200 bags',
      description: 'Acquired 200 bags from Tokyo Cement for slab casting.',
      amount: 370000,
      currency: 'LKR',
      status: 'APPROVED',
      expenseDate: '2026-06-15',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      submittedBy: { firstName: 'Kasun', lastName: 'Silva' },
      project: { name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' }
    },
    {
      id: 'exp2',
      projectId: 'prj1',
      submittedById: 'eng',
      category: 'LABOUR',
      title: 'Overtime wages - week 24',
      description: 'Additional hours logged by masons for column work.',
      amount: 85000,
      currency: 'LKR',
      status: 'PENDING',
      expenseDate: '2026-06-20',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      submittedBy: { firstName: 'Kasun', lastName: 'Silva' },
      project: { name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' }
    }
  ];

  const mockPending: Expense[] = [
    {
      id: 'exp2',
      projectId: 'prj1',
      submittedById: 'eng',
      category: 'LABOUR',
      title: 'Overtime wages - week 24',
      description: 'Additional hours logged by masons for column work.',
      amount: 85000,
      currency: 'LKR',
      status: 'PENDING',
      expenseDate: '2026-06-20',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      submittedBy: { firstName: 'Kasun', lastName: 'Silva' },
      project: { name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' }
    },
    {
      id: 'exp4',
      projectId: 'prj2',
      submittedById: 'eng',
      category: 'MATERIAL',
      title: 'Steel reinforcement bars',
      description: 'Required reinforcement bars for villa column structure.',
      amount: 1425000,
      currency: 'LKR',
      status: 'PENDING',
      expenseDate: '2026-06-10',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      submittedBy: { firstName: 'Kasun', lastName: 'Silva' },
      project: { name: 'Palm Villa - Negombo', code: 'PRJ-002' }
    }
  ];

  const projectsList = projectsData?.data || [
    { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' },
    { id: 'prj2', name: 'Palm Villa - Negombo', code: 'PRJ-002' }
  ];

  const expenses = (selectedProjectId === 'ALL' || selectedProjectId === '') ? mockLedger : (ledgerData || mockLedger);
  const pendingApprovals = pendingData || mockPending;

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Expenses Ledger
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Log financial expenses, materials receipts, and process approvals.
          </p>
        </div>

        {/* Dialog Trigger */}
        {activeTab === 'ledger' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/10" />}>
              <Plus className="w-4 h-4 mr-2" />
              Log Expense
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Purchase Expense</DialogTitle>
                <DialogDescription>
                  Record site expenses and receipt metadata.
                </DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleCreateExpense)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Expense Title *</Label>
                  <Input id="title" placeholder="Concrete supplier payment" {...register('title')} />
                  {errors.title && <p className="text-xs text-destructive font-medium">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select 
                      id="category" 
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
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
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (LKR) *</Label>
                    <Input id="amount" type="number" placeholder="50000" {...register('amount')} />
                    {errors.amount && <p className="text-xs text-destructive font-medium">{errors.amount.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Expense Date *</Label>
                  <Input id="expenseDate" type="date" {...register('expenseDate')} />
                  {errors.expenseDate && <p className="text-xs text-destructive font-medium">{errors.expenseDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Remarks / Description</Label>
                  <textarea 
                    id="description" 
                    placeholder="Provide details regarding the supplier invoice..."
                    className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                    {...register('description')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging...
                      </>
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

      {/* Tabs navigation */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2 pb-px">
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

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'ledger' && (
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
                <option value="ALL">All Demo Expenses</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {isLedgerLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Logged Ledger Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Expense title</th>
                          <th className="pb-3 font-semibold">Category</th>
                          <th className="pb-3 font-semibold">Amount (LKR)</th>
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">Submitter</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-3.5">
                              <div>
                                <div className="font-semibold text-zinc-800 dark:text-zinc-200">{exp.title}</div>
                                {exp.description && <span className="text-[10px] text-zinc-400 font-medium">{exp.description}</span>}
                              </div>
                            </td>
                            <td className="py-3.5 text-zinc-500 text-xs">{exp.category}</td>
                            <td className="py-3.5 font-bold text-zinc-900 dark:text-white">LKR {exp.amount.toLocaleString()}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">{exp.submittedBy?.firstName} {exp.submittedBy?.lastName}</td>
                            <td className="py-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadgeColor(exp.status)}`}>
                                {exp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
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
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
                <FileCheck2 className="w-10 h-10 text-zinc-300" />
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No pending approvals</p>
                  <p className="text-xs text-zinc-500 mt-1">Excellent! All logged expenses are processed.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingApprovals.map((exp) => (
                  <Card key={exp.id} className="border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                    <CardHeader className="pb-2 pl-6">
                      <div className="flex justify-between items-baseline gap-2 mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {exp.project?.code} • {exp.category}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(exp.expenseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{exp.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-6 space-y-4">
                      {exp.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {exp.description}
                        </p>
                      )}

                      <div className="flex justify-between items-baseline border-y border-zinc-100 dark:border-zinc-900 py-3">
                        <span className="text-zinc-400 text-xs font-semibold">Total Amount</span>
                        <span className="text-xl font-bold text-rose-500">LKR {exp.amount.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-zinc-500">
                        <span>Submitted by: <strong className="text-zinc-700 dark:text-zinc-300">{exp.submittedBy?.firstName} {exp.submittedBy?.lastName}</strong></span>
                      </div>

                      {/* Approval buttons */}
                      {rejectingExpenseId === exp.id ? (
                        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                          <Label htmlFor="rejectReason" className="text-xs">Reason for Rejection *</Label>
                          <Input 
                            id="rejectReason" 
                            placeholder="e.g. Budget cap exceeded, duplicate invoice" 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end pt-1">
                            <Button variant="ghost" size="sm" onClick={() => setRejectingExpenseId(null)} disabled={rejectMutation.isPending}>
                              Cancel
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleRejectSubmit(exp.id)} disabled={rejectMutation.isPending || !rejectionReason.trim()}>
                              {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Reject'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setRejectingExpenseId(exp.id)} 
                            className="border-zinc-200 dark:border-zinc-800 text-rose-600 hover:bg-rose-50/50"
                            disabled={approveMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleApprove(exp.id)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1.5" />
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
