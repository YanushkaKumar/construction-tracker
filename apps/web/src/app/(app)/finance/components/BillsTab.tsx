'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Calendar, ChevronRight } from 'lucide-react';
import { SkeletonStatGrid } from '@/components/ui/skeleton';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function BillsTab({ onDrillDown }: { onDrillDown: (type: string, payload: any) => void }) {
  const { data: billsData, isLoading } = useQuery<any>({
    queryKey: ['finance-bills'],
    queryFn: async () => (await apiClient.get('/finance/bills')).data,
    retry: 1,
  });

  if (isLoading) return <SkeletonStatGrid count={4} />;
  if (!billsData) return null;

  const { totalPending, totalOverdue, categories } = billsData;

  const renderBillCard = (b: any) => (
    <div key={b.id} onClick={() => onDrillDown('BILL_DETAIL', b)} className="flex items-center justify-between p-4 bg-card border border-border/20 rounded-xl hover:border-primary/40 cursor-pointer transition-colors shadow-sm mb-3">
      <div>
        <h4 className="font-bold text-[14px]">{b.vendor}</h4>
        <p className="text-[11px] text-muted-foreground/70 font-mono mt-0.5">{b.title}</p>
        <div className="flex gap-2 mt-2">
          {b.projects?.map((p: any) => (
            <span key={p.id} className="text-[9px] bg-accent/30 text-muted-foreground px-2 py-0.5 rounded-md font-semibold">{p.name}</span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <p className="text-[14px] font-bold font-mono text-foreground">{fmt(b.totalAmount)}</p>
        {b.balance > 0 && <p className="text-[11px] text-danger font-bold mt-0.5">Bal: {fmt(b.balance)}</p>}
        {b.dueDate && <p className="text-[10px] text-muted-foreground mt-1">Due: {new Date(b.dueDate).toLocaleDateString()}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-warning-subtle rounded-xl"><Clock className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Pending</p>
              <h3 className="text-[18px] font-bold font-mono">{fmt(totalPending)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-danger-subtle rounded-xl"><AlertCircle className="w-5 h-5 text-danger" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Overdue</p>
              <h3 className="text-[18px] font-bold text-danger font-mono">{fmt(totalOverdue)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-info-subtle rounded-xl"><Calendar className="w-5 h-5 text-info" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Upcoming</p>
              <h3 className="text-[18px] font-bold font-mono">{categories.upcoming.length} Bills</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-success-subtle rounded-xl"><CheckCircle2 className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Paid</p>
              <h3 className="text-[18px] font-bold text-success font-mono">{categories.paid.length} Bills</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3 border-b border-border/10 pb-2">Overdue Bills</h3>
          {categories.overdue.length === 0 ? (
             <div className="p-6 text-center border border-border/10 rounded-xl bg-card text-muted-foreground text-sm font-semibold">No overdue bills</div>
          ) : categories.overdue.map(renderBillCard)}
          
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3 mt-6 border-b border-border/10 pb-2">Pending Bills</h3>
          {categories.pending.length === 0 ? (
             <div className="p-6 text-center border border-border/10 rounded-xl bg-card text-muted-foreground text-sm font-semibold">No pending bills</div>
          ) : categories.pending.map(renderBillCard)}
        </div>
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3 border-b border-border/10 pb-2">Upcoming Bills</h3>
          {categories.upcoming.length === 0 ? (
             <div className="p-6 text-center border border-border/10 rounded-xl bg-card text-muted-foreground text-sm font-semibold">No upcoming bills</div>
          ) : categories.upcoming.map(renderBillCard)}

          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3 mt-6 border-b border-border/10 pb-2">Recently Paid</h3>
          {categories.paid.slice(0, 5).length === 0 ? (
             <div className="p-6 text-center border border-border/10 rounded-xl bg-card text-muted-foreground text-sm font-semibold">No recently paid bills</div>
          ) : categories.paid.slice(0, 5).map(renderBillCard)}
        </div>
      </div>
    </div>
  );
}
