'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight, Receipt, FileCheck, Truck, CheckCircle2 } from 'lucide-react';
import { SkeletonStatGrid } from '@/components/ui/skeleton';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function ProcurementTab() {
  const { data: billsData, isLoading } = useQuery<any>({
    queryKey: ['finance-bills'],
    queryFn: async () => (await apiClient.get('/finance/bills')).data,
    retry: 1,
  });

  if (isLoading) return <SkeletonStatGrid count={4} />;
  if (!billsData) return null;

  const { categories } = billsData;

  const allPurchases = [...categories.pending, ...categories.overdue, ...categories.upcoming, ...categories.paid];

  // In a real implementation, we would group by workflowStage.
  // For this demo, we'll map status to stages to show the Kanban.

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-4">
        
        {/* Stage 1: Request & Approval */}
        <div className="w-[320px] shrink-0">
           <div className="flex items-center gap-2 mb-4 px-2">
             <div className="p-1.5 bg-accent rounded-md"><Receipt className="w-4 h-4" /></div>
             <h3 className="font-bold text-[14px]">Requests</h3>
             <span className="ml-auto bg-accent text-[11px] font-bold px-2 py-0.5 rounded-full">0</span>
           </div>
           <div className="space-y-3">
             <div className="p-6 text-center border border-border/10 border-dashed rounded-xl bg-card/50 text-muted-foreground text-sm font-semibold">No pending requests</div>
           </div>
        </div>

        {/* Stage 2: PO Generated */}
        <div className="w-[320px] shrink-0">
           <div className="flex items-center gap-2 mb-4 px-2">
             <div className="p-1.5 bg-primary/20 text-primary rounded-md"><FileCheck className="w-4 h-4" /></div>
             <h3 className="font-bold text-[14px]">Purchase Orders</h3>
             <span className="ml-auto bg-primary/20 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">{categories.upcoming.length}</span>
           </div>
           <div className="space-y-3">
             {categories.upcoming.map((b: any) => (
                <Card key={b.id} className="shadow-sm border-border/20 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-[12px] font-bold text-primary mb-1">PO-2026-{b.id.slice(-4).toUpperCase()}</p>
                    <h4 className="font-bold text-[14px]">{b.vendor}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{b.title}</p>
                    <div className="flex justify-between items-end mt-4">
                      <p className="text-[14px] font-bold font-mono">{fmt(b.totalAmount)}</p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </CardContent>
                </Card>
             ))}
           </div>
        </div>

        {/* Stage 3: Received & Invoiced */}
        <div className="w-[320px] shrink-0">
           <div className="flex items-center gap-2 mb-4 px-2">
             <div className="p-1.5 bg-warning-subtle text-warning rounded-md"><Truck className="w-4 h-4" /></div>
             <h3 className="font-bold text-[14px]">Invoiced (Bills)</h3>
             <span className="ml-auto bg-warning-subtle text-warning text-[11px] font-bold px-2 py-0.5 rounded-full">{categories.pending.length + categories.overdue.length}</span>
           </div>
           <div className="space-y-3">
             {[...categories.pending, ...categories.overdue].map((b: any) => (
                <Card key={b.id} className="shadow-sm border-border/20 cursor-grab active:cursor-grabbing hover:border-warning/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[12px] font-bold text-warning">INV-{b.id.slice(-4).toUpperCase()}</p>
                      {b.balance > 0 && <span className="bg-danger/10 text-danger text-[10px] font-bold px-1.5 py-0.5 rounded">Unpaid</span>}
                    </div>
                    <h4 className="font-bold text-[14px]">{b.vendor}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{b.title}</p>
                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-border/10">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Amount</p>
                        <p className="text-[14px] font-bold font-mono">{fmt(b.totalAmount)}</p>
                      </div>
                      <button className="text-[11px] font-bold bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-90">Pay Bill</button>
                    </div>
                  </CardContent>
                </Card>
             ))}
           </div>
        </div>

        {/* Stage 4: Completed */}
        <div className="w-[320px] shrink-0">
           <div className="flex items-center gap-2 mb-4 px-2">
             <div className="p-1.5 bg-success-subtle text-success rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
             <h3 className="font-bold text-[14px]">Completed</h3>
             <span className="ml-auto bg-success-subtle text-success text-[11px] font-bold px-2 py-0.5 rounded-full">{categories.paid.length}</span>
           </div>
           <div className="space-y-3">
             {categories.paid.slice(0,10).map((b: any) => (
                <Card key={b.id} className="shadow-sm border-border/20 opacity-70 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <p className="text-[12px] font-bold text-success mb-1">PAID</p>
                    <h4 className="font-bold text-[14px]">{b.vendor}</h4>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-[14px] font-bold font-mono">{fmt(b.totalAmount)}</p>
                    </div>
                  </CardContent>
                </Card>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
