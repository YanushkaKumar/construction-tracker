'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CircleDollarSign, TrendingUp, TrendingDown, FileText, ChevronRight, AlertCircle, Building2 } from 'lucide-react';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function DashboardTab({ 
  data, 
  onDrillDown 
}: { 
  data: any, 
  onDrillDown: (type: string, payload?: any) => void 
}) {
  if (!data) return null;
  const { companyTotals, projectBreakdown, categoryBreakdown, billsSummary } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Cash */}
        <Card className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm" onClick={() => onDrillDown('CASH')}>
          <CardContent className="p-5 flex flex-col justify-between h-full group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <CircleDollarSign className="w-5 h-5 text-primary" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">Available Cash</p>
              <h3 className="text-2xl font-bold text-foreground font-mono">{fmt(companyTotals.balance)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></span>
                Across all company accounts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="cursor-pointer hover:border-success/50 transition-colors shadow-sm" onClick={() => onDrillDown('INCOME')}>
          <CardContent className="p-5 flex flex-col justify-between h-full group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-success-subtle rounded-xl">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-success transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">Total Received</p>
              <h3 className="text-2xl font-bold text-success font-mono">+{fmt(companyTotals.totalAdvance)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-info mr-1.5"></span>
                Advances, loans, & capital
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="cursor-pointer hover:border-danger/50 transition-colors shadow-sm" onClick={() => onDrillDown('EXPENSES')}>
          <CardContent className="p-5 flex flex-col justify-between h-full group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-danger-subtle rounded-xl">
                <TrendingDown className="w-5 h-5 text-danger" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-danger transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">Total Expenditure</p>
              <h3 className="text-2xl font-bold text-danger font-mono">-{fmt(companyTotals.totalSpent)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5"></span>
                Purchases & operational costs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Bills */}
        <Card className="cursor-pointer hover:border-warning/50 transition-colors shadow-sm" onClick={() => onDrillDown('BILLS')}>
          <CardContent className="p-5 flex flex-col justify-between h-full group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-warning-subtle rounded-xl">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-warning transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">Outstanding Bills</p>
              <h3 className="text-2xl font-bold text-foreground font-mono">{fmt(billsSummary?.totalPending || 0)}</h3>
              <p className="text-[11px] text-danger/80 mt-1.5 font-bold flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fmt(billsSummary?.totalOverdue || 0)} overdue
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Project Financial Center
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projectBreakdown.map((p: any) => (
            <Card key={p.id} className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-elevated" onClick={() => onDrillDown('PROJECT', p)}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-[15px]">{p.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">{p.code}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold text-success font-mono">{p.workDonePercent}% Done</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-muted-foreground/80 font-medium">Budget</span>
                    <span className="font-semibold font-mono">{fmt(p.budgetEstimate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-muted-foreground/80 font-medium">Spent</span>
                    <span className="font-semibold font-mono text-danger">-{fmt(p.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] pt-2 border-t border-border/15">
                    <span className="text-muted-foreground font-bold">Remaining</span>
                    <span className="font-bold font-mono text-primary">{fmt(p.budgetEstimate - p.totalSpent)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/10 flex justify-between items-center text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                    View Workspace <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
