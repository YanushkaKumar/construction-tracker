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

  const { data: loans, isLoading, isFetching } = useQuery<any[]>({
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

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center bg-card/65 backdrop-blur-xl p-4 rounded-2xl border border-border/25 shadow-surface text-left select-none">
        <div>
          <h2 className="text-[18px] lg:text-[20px] font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Company Bank Loans
            {(isFetching || createLoan.isPending || createRepayment.isPending || delLoan.isPending || deleteRepayment.isPending) && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </h2>
          <p className="text-[13px] text-muted-foreground font-semibold mt-0.5">Manage external financing, track loan drawdowns, and record repayments.</p>
        </div>
        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold h-9 px-3.5 rounded-xl text-xs transition-all shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
            <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
              <DialogTitle className="text-sm font-bold">Add New Bank Loan</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">Record a new loan facility from a bank or institution.</DialogDescription>
            </DialogHeader>
            {err && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{err}</AlertDescription></Alert>}
            <form onSubmit={form.handleSubmit(v => { setErr(null); createLoan.mutate(v); })} className="space-y-4 pt-1 font-semibold text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Bank / Institution Name *</Label>
                <Input placeholder="e.g. Commercial Bank" {...form.register('bankName')} className={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Loan Amount (LKR) *</Label>
                  <Input type="number" {...form.register('loanAmount')} className={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Interest Rate (%) *</Label>
                  <Input type="number" step="0.1" {...form.register('interestRate')} className={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Received Date *</Label>
                  <Input type="date" {...form.register('receivedDate')} className={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Status</Label>
                  <select className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold" {...form.register('status')}>
                    <option value="ACTIVE">Active</option>
                    <option value="PAID_OFF">Paid Off</option>
                    <option value="DEFAULTED">Defaulted</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15">
                <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setDlg(false)}>Cancel</Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={createLoan.isPending}>
                  {createLoan.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : 'Save Loan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Repayment Dialog */}
      <Dialog open={repayDlg} onOpenChange={setRepayDlg}>
        <DialogContent className="max-w-md rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
          <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Coins className="w-5 h-5 text-success" />
              Record Loan Repayment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Add a repayment to reduce the outstanding debt balance of this loan.</DialogDescription>
          </DialogHeader>
          {repayErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{repayErr}</AlertDescription></Alert>}
          <form onSubmit={repayForm.handleSubmit(v => { 
            if (repayLoanId) {
              setRepayErr(null);
              createRepayment.mutate({ loanId: repayLoanId, values: v });
            }
          })} className="space-y-4 pt-1 font-semibold text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Repayment Amount (LKR) *</Label>
              <Input type="number" placeholder="500000" {...repayForm.register('amount')} className={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Payment Date *</Label>
                <Input type="date" {...repayForm.register('paymentDate')} className={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Reference No. / Cheque No.</Label>
                <Input placeholder="REF-1092" {...repayForm.register('referenceNo')} className={inputStyle} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Notes</Label>
              <Input placeholder="Principal repayment, monthly installment, etc." {...repayForm.register('notes')} className={inputStyle} />
            </div>
            <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15">
              <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setRepayDlg(false)}>Cancel</Button>
              <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={createRepayment.isPending}>
                {createRepayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : 'Record Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(loans || []).map(loan => {
            const outstanding = loan.outstandingDebt ?? loan.loanAmount;
            
            return (
              <Card key={loan.id} className="overflow-hidden glass-panel border-border/30 rounded-2xl relative shadow-panel text-left hover:border-border/60 transition-all duration-300">
                <div className="h-1 w-full bg-primary/60" />
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 select-none">
                        <Building className="w-4.5 h-4.5 text-primary" />
                        <h3 className="font-bold text-[18px] lg:text-[20px] text-foreground">{loan.bankName}</h3>
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 font-semibold bg-accent/40 border border-border/25 px-2.5 py-0.5 rounded-lg select-none font-mono">
                        Received: {new Date(loan.receivedDate).toLocaleDateString()} • {loan.interestRate}% Interest
                      </span>
                    </div>
                    <div className="flex items-center gap-2 select-none">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono ${
                        loan.status === 'ACTIVE' ? 'bg-success-subtle/10 border border-success/25 text-success' : 
                        loan.status === 'PAID_OFF' ? 'bg-info-subtle/10 border border-info/25 text-info' :
                        'bg-danger-subtle/10 border border-danger/25 text-danger'
                      }`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-danger/60 hover:text-danger hover:bg-danger-subtle rounded-lg" onClick={() => delLoan.mutate(loan.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 p-4 rounded-xl bg-accent/15 border border-border/20 font-semibold select-none">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-0.5 tracking-wider font-mono">Total Facility</p>
                      <p className="text-[15px] font-bold text-foreground font-mono">{fmt(loan.loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-0.5 tracking-wider font-mono">Outstanding</p>
                      <p className="text-[15px] font-bold text-foreground font-mono">{fmt(outstanding)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-0.5 tracking-wider font-mono">Advances Spent</p>
                      <p className="text-[15px] font-bold text-success font-mono">{fmt(loan.spent ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-0.5 tracking-wider font-mono">Purchases Spent</p>
                      <p className="text-[15px] font-bold text-danger font-mono">{fmt(loan.spentPurchases ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-0.5 tracking-wider font-mono">Repaid Amount</p>
                      <p className="text-[15px] font-bold text-info font-mono">{fmt(loan.repaidAmount ?? 0)}</p>
                    </div>
                  </div>

                  {loan.notes && (
                    <p className="text-[13px] text-muted-foreground font-semibold leading-relaxed">{loan.notes}</p>
                  )}

                  {/* Accordion / Details toggle */}
                  <div className="pt-2 border-t border-border/15 flex items-center justify-between gap-4 select-none">
                    <Button 
                      variant="ghost" 
                      className="text-xs font-bold hover:bg-accent/40 text-muted-foreground hover:text-foreground rounded-lg h-8 px-2.5 flex items-center gap-1.5"
                      onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                    >
                      <History className="w-3.5 h-3.5" />
                      {expandedLoanId === loan.id ? 'Hide Statement' : 'View Statement'}
                    </Button>

                    {loan.status === 'ACTIVE' && (
                      <Button className="bg-foreground text-background hover:bg-foreground/90 font-bold h-8 px-3 rounded-lg text-xs shadow-sm flex items-center gap-1" onClick={() => handleOpenRepay(loan.id)}>
                        <Coins className="w-3.5 h-3.5" /> Record Repayment
                      </Button>
                    )}
                  </div>

                  {/* Expanded Repayments Log */}
                  {expandedLoanId === loan.id && (
                    <div className="pt-4 border-t border-border/15 space-y-3.5">
                      <h4 className="text-[13px] font-bold text-foreground">Facility Repayment Statement</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[15px] text-left font-semibold">
                          <thead>
                            <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[10px] font-mono select-none">
                              <th className="pb-2">Date</th>
                              <th className="pb-2">Reference</th>
                              <th className="pb-2">Notes</th>
                              <th className="pb-2 text-right">Repayment Out</th>
                              <th className="pb-2 pr-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(loan.repayments || []).map((r: any) => (
                              <tr key={r.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                                <td className="py-2 text-muted-foreground/80 font-mono">{new Date(r.paymentDate).toLocaleDateString()}</td>
                                <td className="py-2 text-foreground font-mono">{r.referenceNo || '—'}</td>
                                <td className="py-2 text-muted-foreground/75 font-normal">{r.notes || '—'}</td>
                                <td className="py-2 text-right font-semibold text-info font-mono">{fmt(r.amount)}</td>
                                <td className="py-2 pr-2 text-right">
                                  <button className="text-muted-foreground/60 hover:text-danger p-1 transition-colors rounded hover:bg-danger/10" onClick={() => deleteRepayment.mutate(r.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(!loan.repayments || loan.repayments.length === 0) && (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-muted-foreground/60 italic text-[15px] font-normal select-none">
                                  No repayments have been recorded for this facility.
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
            <div className="flex flex-col items-center justify-center py-16 text-center glass-panel border-border/30 rounded-2xl select-none">
              <Landmark className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
              <p className="text-sm font-bold text-foreground mb-1">No Bank Loan Records</p>
              <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">Add a new bank loan facility to record external debt capital allocations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
