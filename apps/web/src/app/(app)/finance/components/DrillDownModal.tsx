'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Building2, CircleDollarSign, TrendingDown, Users, ChevronRight, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function DrillDownModal({ 
  open, 
  onOpenChange, 
  type, 
  payload 
}: { 
  open: boolean; 
  onOpenChange: (o: boolean) => void; 
  type: string | null; 
  payload: any; 
}) {
  const { data: drillDownData, isLoading } = useQuery({
    queryKey: ['finance-expense-drilldown'],
    queryFn: async () => (await apiClient.get('/finance/expenses/drill-down')).data,
    enabled: open && type === 'EXPENSES',
  });

  if (!type) return null;

  const renderExpenses = () => {
    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!drillDownData) return null;

    return (
      <div className="space-y-6">
        {Object.entries(drillDownData).map(([category, catData]: [string, any]) => (
          <div key={category} className="border border-border/10 rounded-xl overflow-hidden bg-card">
            <div className="bg-accent/30 p-4 border-b border-border/10 flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-widest text-[13px]">{category}</h3>
              <span className="font-mono font-bold text-danger">{fmt(catData.total)}</span>
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(catData.items).map(([item, itemData]: [string, any]) => (
                <div key={item} className="pl-2 border-l-2 border-border/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-[14px]">{item}</p>
                    <span className="font-mono text-[13px] font-bold text-muted-foreground">{fmt(itemData.total)}</span>
                  </div>
                  <div className="space-y-3 pl-4 mt-2">
                    {Object.entries(itemData.vendors).map(([vendor, vendorData]: [string, any]) => (
                      <div key={vendor} className="bg-background border border-border/20 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2 border-b border-border/10 pb-2">
                          <p className="text-[12px] font-bold text-muted-foreground uppercase">{vendor}</p>
                          <span className="font-mono text-[12px] font-bold">{fmt(vendorData.total)}</span>
                        </div>
                        <div className="space-y-1">
                          {vendorData.transactions.map((tx: any) => (
                            <div key={tx.id} className="flex justify-between items-center text-[11px] py-1 hover:bg-accent/20 rounded px-2 cursor-pointer transition-colors">
                              <span className="font-mono text-muted-foreground/80">{new Date(tx.date).toLocaleDateString()}</span>
                              <span className="flex-1 px-4 truncate font-semibold">{tx.user}</span>
                              <span className="font-mono text-danger font-bold">{fmt(tx.amount)} <ArrowRight className="inline w-3 h-3 ml-1 text-primary" /></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'PROJECT':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-accent/20 p-4 rounded-xl border border-border/10">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
                <p className="text-[16px] font-mono font-bold">{fmt(payload.budgetEstimate)}</p>
              </div>
              <div className="bg-success-subtle p-4 rounded-xl border border-success/10">
                <p className="text-[11px] font-bold text-success uppercase tracking-wider mb-1">Income</p>
                <p className="text-[16px] font-mono font-bold text-success">+{fmt(payload.totalAdvance)}</p>
              </div>
              <div className="bg-danger-subtle p-4 rounded-xl border border-danger/10">
                <p className="text-[11px] font-bold text-danger uppercase tracking-wider mb-1">Spent</p>
                <p className="text-[16px] font-mono font-bold text-danger">-{fmt(payload.totalSpent)}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Balance</p>
                <p className="text-[16px] font-mono font-bold text-primary">{fmt(payload.balance)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 border-b border-border/10 pb-2">Workspace Shortcuts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button className="flex items-center justify-between p-4 bg-card hover:bg-accent/40 border border-border/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success-subtle rounded-lg"><CircleDollarSign className="w-4 h-4 text-success" /></div>
                    <div className="text-left">
                      <p className="font-bold text-[13px]">Project Income</p>
                      <p className="text-[11px] text-muted-foreground font-semibold">Advances & Client Payments</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>
                <button className="flex items-center justify-between p-4 bg-card hover:bg-accent/40 border border-border/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-danger-subtle rounded-lg"><TrendingDown className="w-4 h-4 text-danger" /></div>
                    <div className="text-left">
                      <p className="font-bold text-[13px]">Expenses & Purchases</p>
                      <p className="text-[11px] text-muted-foreground font-semibold">Material, Labour & Equipment</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>
                <button className="flex items-center justify-between p-4 bg-card hover:bg-accent/40 border border-border/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning-subtle rounded-lg"><FileText className="w-4 h-4 text-warning" /></div>
                    <div className="text-left">
                      <p className="font-bold text-[13px]">Outstanding Bills</p>
                      <p className="text-[11px] text-muted-foreground font-semibold">Pending payments & invoices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>
                <button className="flex items-center justify-between p-4 bg-card hover:bg-accent/40 border border-border/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-4 h-4 text-primary" /></div>
                    <div className="text-left">
                      <p className="font-bold text-[13px]">Labour & Staff</p>
                      <p className="text-[11px] text-muted-foreground font-semibold">Wages and active workforce</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'EXPENSES':
        return renderExpenses();

      case 'BILL_DETAIL':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-card border border-border/20 rounded-xl">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Supplier</p>
                <h3 className="text-lg font-bold">{payload.vendor}</h3>
                <p className="text-[12px] font-semibold text-muted-foreground mt-0.5">{payload.title}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Bill</p>
                <h3 className="text-xl font-bold font-mono text-danger">{fmt(payload.totalAmount)}</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 border-b border-border/10 pb-2">Payment Status</h4>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <div className="flex-1 bg-accent/20 p-4 rounded-xl border border-border/10">
                  <p className="text-muted-foreground mb-1 text-[11px] uppercase">Paid Amount</p>
                  <p className="text-success font-mono">{fmt(payload.paidAmount)}</p>
                </div>
                <div className="flex-1 bg-accent/20 p-4 rounded-xl border border-border/10">
                  <p className="text-muted-foreground mb-1 text-[11px] uppercase">Remaining Balance</p>
                  <p className="text-danger font-mono">{fmt(payload.balance)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 border-b border-border/10 pb-2">Purchase Journey</h4>
              <div className="relative border-l-2 border-border/30 ml-3 pl-5 space-y-5 py-2">
                <div className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-success ring-4 ring-background" />
                  <p className="text-[13px] font-bold">Purchase Requested</p>
                  <p className="text-[11px] text-muted-foreground font-semibold">By {payload.purchasedBy?.firstName} {payload.purchasedBy?.lastName}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-success ring-4 ring-background" />
                  <p className="text-[13px] font-bold">Approved & Ordered</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-warning ring-4 ring-background" />
                  <p className="text-[13px] font-bold">Invoice Received</p>
                  <p className="text-[11px] text-muted-foreground font-semibold">Awaiting payment completion</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center border border-border/10 rounded-xl bg-card text-muted-foreground text-sm font-semibold">
            Details for {type}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/20 shadow-modal rounded-3xl p-8">
        <DialogHeader className="mb-6 pb-4 border-b border-border/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {type === 'PROJECT' && <Building2 className="w-6 h-6 text-primary" />}
            {type === 'EXPENSES' && <TrendingDown className="w-6 h-6 text-danger" />}
            {type === 'BILL_DETAIL' && <FileText className="w-6 h-6 text-warning" />}
            {type === 'PROJECT' ? `Project Workspace: ${payload.name}` :
             type === 'EXPENSES' ? 'Expense Drill-Down' :
             type === 'BILL_DETAIL' ? 'Bill Overview' : type}
          </DialogTitle>
          <DialogDescription className="text-[13px] font-medium text-muted-foreground mt-1.5">
            {type === 'PROJECT' && 'Complete financial control center for this project.'}
            {type === 'BILL_DETAIL' && 'Detailed lifecycle and payment status of this bill.'}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
