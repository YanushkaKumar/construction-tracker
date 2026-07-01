'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building, Plus, Landmark, Loader2, AlertCircle, Trash2, Calendar, Coins, History, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loanSchema = z.object({
  bankName: z.string().min(2, 'Required'),
  loanAmount: z.coerce.number().min(1, 'Required'),
  interestRate: z.coerce.number().min(0, 'Required'),
  receivedDate: z.string().min(1, 'Required'),
  status: z.enum(['ACTIVE', 'PAID_OFF', 'DEFAULTED']).default('ACTIVE'),
  notes: z.string().optional(),
});

const repaymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Required'),
  paymentDate: z.string().min(1, 'Required'),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

const fmt = (n: number) => `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export function BankLoansTab() {
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Repayment states
  const [repayDlg, setRepayDlg] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayErr, setRepayErr] = useState<string | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const { data: loans, isLoading } = useQuery<any[]>({
    queryKey: ['bank-loans'],
    queryFn: async () => (await apiClient.get('/bank-loans')).data,
  });

  const form = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: { bankName: '', loanAmount: 0, interestRate: 0, receivedDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' as const, notes: '' }
  });

  const repayForm = useForm({
    resolver: zodResolver(repaymentSchema),
    defaultValues: { amount: 0, paymentDate: new Date().toISOString().split('T')[0], referenceNo: '', notes: '' }
  });

  const createLoan = useMutation({
    mutationFn: async (v: any) => (await apiClient.post('/bank-loans', v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-loans'] }); setDlg(false); form.reset(); },
    onError: (e: any) => setErr(e.response?.data?.message || 'Failed to add loan'),
  });

  const delLoan = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/bank-loans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-loans'] }),
  });

  const createRepayment = useMutation({
    mutationFn: async ({ loanId, values }: { loanId: string; values: any }) => 
      (await apiClient.post(`/bank-loans/${loanId}/repayments`, values)).data,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['bank-loans'] }); 
      setRepayDlg(false); 
      repayForm.reset(); 
    },
    onError: (e: any) => setRepayErr(e.response?.data?.message || 'Failed to record repayment'),
  });

  const deleteRepayment = useMutation({
    mutationFn: async (repaymentId: string) => 
      await apiClient.delete(`/bank-loans/repayments/${repaymentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-loans'] }),
  });

  const handleOpenRepay = (loanId: string) => {
    setRepayLoanId(loanId);
    setRepayErr(null);
    repayForm.reset({
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      notes: ''
    });
    setRepayDlg(true);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-500 animate-pulse" /> Company Bank Loans
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Manage external financing, track loan drawdowns, and record repayments.</p>
        </div>
        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Bank Loan</DialogTitle>
              <DialogDescription>Record a new loan facility from a bank or institution.</DialogDescription>
            </DialogHeader>
            {err && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{err}</AlertDescription></Alert>}
            <form onSubmit={form.handleSubmit(v => { setErr(null); createLoan.mutate(v); })} className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-semibold">Bank / Institution Name</Label>
                <Input placeholder="e.g. Commercial Bank" className="mt-1.5" {...form.register('bankName')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Loan Amount (LKR)</Label>
                  <Input type="number" className="mt-1.5" {...form.register('loanAmount')} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Interest Rate (%)</Label>
                  <Input type="number" step="0.1" className="mt-1.5" {...form.register('interestRate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Received Date</Label>
                  <Input type="date" className="mt-1.5" {...form.register('receivedDate')} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Status</Label>
                  <select className="flex h-10 w-full mt-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" {...form.register('status')}>
                    <option value="ACTIVE">Active</option>
                    <option value="PAID_OFF">Paid Off</option>
                    <option value="DEFAULTED">Defaulted</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="ghost" onClick={() => setDlg(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" disabled={createLoan.isPending}>
                  {createLoan.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Loan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Repayment Dialog */}
      <Dialog open={repayDlg} onOpenChange={setRepayDlg}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-500" />
              Record Loan Repayment
            </DialogTitle>
            <DialogDescription>Add a repayment to reduce the outstanding debt balance of this loan.</DialogDescription>
          </DialogHeader>
          {repayErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{repayErr}</AlertDescription></Alert>}
          <form onSubmit={repayForm.handleSubmit(v => { 
            if (repayLoanId) {
              setRepayErr(null);
              createRepayment.mutate({ loanId: repayLoanId, values: v });
            }
          })} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Repayment Amount (LKR) *</Label>
              <Input type="number" placeholder="500000" className="mt-1.5" {...repayForm.register('amount')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Payment Date *</Label>
                <Input type="date" className="mt-1.5" {...repayForm.register('paymentDate')} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Reference No. / Cheque No.</Label>
                <Input placeholder="REF-1092" className="mt-1.5" {...repayForm.register('referenceNo')} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Notes</Label>
              <Input placeholder="Principal repayment, monthly installment, etc." className="mt-1.5" {...repayForm.register('notes')} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="ghost" onClick={() => setRepayDlg(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" disabled={createRepayment.isPending}>
                {createRepayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Record Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {(loans || []).map(loan => {
            const progress = loan.loanAmount > 0 ? (loan.spent / loan.loanAmount) * 100 : 0;
            const outstanding = loan.outstandingDebt ?? loan.loanAmount;
            
            return (
              <Card key={loan.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950 hover:shadow-xl transition-all duration-300">
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Building className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{loan.bankName}</h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-semibold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        Received: {new Date(loan.receivedDate).toLocaleDateString()} • {loan.interestRate}% Interest
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                        loan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500' : 
                        loan.status === 'PAID_OFF' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-450' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-450'
                      }`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50/50" onClick={() => delLoan.mutate(loan.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="text-xs uppercase font-black text-zinc-400 mb-1 tracking-wider">Total Loan Facility</p>
                      <p className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">{fmt(loan.loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-black text-amber-500 mb-1 tracking-wider">Total Spent (Drawn)</p>
                      <p className="font-extrabold text-sm text-amber-600">{fmt(loan.spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-black text-emerald-500 mb-1 tracking-wider">Total Repaid</p>
                      <p className="font-extrabold text-sm text-emerald-600">{fmt(loan.repaid || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-black text-rose-500 mb-1 tracking-wider">Outstanding Debt</p>
                      <p className="font-extrabold text-base text-rose-600">{fmt(outstanding)}</p>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500 uppercase tracking-wider text-xs">Fund Drawdown Utilization</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10"
                      onClick={() => handleOpenRepay(loan.id)}
                    >
                      <Coins className="w-3.5 h-3.5 mr-1.5" />
                      Record Repayment
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs font-bold rounded-xl border-zinc-200/80 hover:bg-zinc-50"
                      onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                    >
                      <History className="w-3.5 h-3.5 mr-1.5" />
                      {expandedLoanId === loan.id ? 'Hide Repayments' : 'Repayment History'}
                    </Button>
                  </div>

                  {/* Repayment History Dropdown */}
                  {expandedLoanId === loan.id && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 space-y-3 animate-in slide-in-from-top-2">
                      <h4 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" /> Repayment Transactions
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                              <th className="pb-2">Payment Date</th>
                              <th className="pb-2">Reference No.</th>
                              <th className="pb-2">Notes</th>
                              <th className="pb-2 text-right">Amount</th>
                              <th className="pb-2 text-right"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {loan.repayments && loan.repayments.length > 0 ? (
                              loan.repayments.map((rep: any) => (
                                <tr key={rep.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                  <td className="py-2.5 font-medium text-zinc-700 dark:text-zinc-300">
                                    {new Date(rep.paymentDate).toLocaleDateString()}
                                  </td>
                                  <td className="py-2.5 text-zinc-500 font-semibold">{rep.referenceNo || 'N/A'}</td>
                                  <td className="py-2.5 text-zinc-500">{rep.notes || '—'}</td>
                                  <td className="py-2.5 text-right font-bold text-emerald-600">{fmt(Number(rep.amount))}</td>
                                  <td className="py-2.5 text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                      onClick={() => deleteRepayment.mutate(rep.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-zinc-400 italic">
                                  No repayments recorded yet for this loan.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {(!loans || loans.length === 0) && (
            <div className="py-16 text-center text-zinc-500 flex flex-col items-center border-2 border-dashed border-zinc-350 dark:border-zinc-800 rounded-3xl bg-zinc-50/20">
              <Landmark className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3 animate-bounce" />
              <p className="font-bold text-sm text-zinc-700 dark:text-zinc-350">No bank loans registered.</p>
              <p className="text-xs text-zinc-500 mt-1">Add a loan to track external financing and project drawdowns.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
