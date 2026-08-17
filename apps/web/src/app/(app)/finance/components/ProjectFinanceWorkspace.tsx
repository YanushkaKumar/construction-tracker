'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Building2, ChevronLeft, ChevronRight, Wallet, Receipt, Briefcase, FileText, ArrowRight, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/custom-charts';
import { SkeletonChart } from '@/components/ui/skeleton';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function ProjectFinanceWorkspace({ 
  projectId, 
  onBack,
  onNavigate
}: { 
  projectId: string;
  onBack: () => void;
  onNavigate?: (tab: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['finance-project-balance', projectId],
    queryFn: async () => (await apiClient.get(`/finance/projects/${projectId}/balance`)).data,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button onClick={onBack} className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Portfolios
        </button>
        <div className="grid grid-cols-4 gap-4"><SkeletonChart height={120} /><SkeletonChart height={120} /><SkeletonChart height={120} /><SkeletonChart height={120} /></div>
        <SkeletonChart height={400} />
      </div>
    );
  }

  if (!data) return null;

  const { project, budgetEstimate, totalAdvance, totalSpent, balance, spendingByCategory, utilizationPercent } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <div>
          <button onClick={onBack} className="flex items-center text-[11px] font-bold text-muted-foreground hover:text-foreground mb-3 transition-colors uppercase tracking-wider">
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Portfolios
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{project.name}</h2>
              <p className="text-[13px] text-muted-foreground font-mono mt-0.5">{project.code} • Workspace</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-success text-success-foreground font-bold text-[12px] rounded-lg shadow-sm hover:opacity-90">
            Receive Funds
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground font-bold text-[12px] rounded-lg shadow-sm hover:opacity-90">
            Create Purchase Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-accent/20 border-border/10">
          <CardContent className="p-5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Budget</p>
            <p className="text-[20px] font-mono font-bold">{fmt(budgetEstimate)}</p>
          </CardContent>
        </Card>
        <Card className="bg-success-subtle border-success/10">
          <CardContent className="p-5">
            <p className="text-[11px] font-bold text-success uppercase tracking-wider mb-1">Wallet Received</p>
            <p className="text-[20px] font-mono font-bold text-success">+{fmt(totalAdvance)}</p>
          </CardContent>
        </Card>
        <Card className="bg-danger-subtle border-danger/10">
          <CardContent className="p-5">
            <p className="text-[11px] font-bold text-danger uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-[20px] font-mono font-bold text-danger">-{fmt(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-5">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-[20px] font-mono font-bold text-primary">{fmt(balance)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Modules */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 pb-3 mb-4">Financial Modules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => onNavigate?.('funding')} className="p-4 border border-border/20 rounded-xl hover:border-primary/50 hover:bg-accent/20 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-success-subtle rounded-lg text-success"><TrendingUp className="w-5 h-5" /></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-[15px]">Income & Allocation</h4>
                  <p className="text-[12px] text-muted-foreground font-medium mt-1">Track funds entering the project wallet</p>
                </div>
              </div>

              <div onClick={() => onNavigate?.('procurement')} className="p-4 border border-border/20 rounded-xl hover:border-primary/50 hover:bg-accent/20 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary"><Wallet className="w-5 h-5" /></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-[15px]">Procurement AP</h4>
                  <p className="text-[12px] text-muted-foreground font-medium mt-1">Purchase Requests, POs, and Bills</p>
                </div>
              </div>

              <div onClick={() => alert("Field Expenses module coming soon!")} className="p-4 border border-border/20 rounded-xl hover:border-primary/50 hover:bg-accent/20 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-danger-subtle rounded-lg text-danger"><TrendingDown className="w-5 h-5" /></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-[15px]">Field Expenses</h4>
                  <p className="text-[12px] text-muted-foreground font-medium mt-1">Petty cash and employee reimbursements</p>
                </div>
              </div>

              <div onClick={() => alert("Subcontractors module coming soon!")} className="p-4 border border-border/20 rounded-xl hover:border-primary/50 hover:bg-accent/20 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-warning-subtle rounded-lg text-warning"><Briefcase className="w-5 h-5" /></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-[15px]">Subcontractors</h4>
                  <p className="text-[12px] text-muted-foreground font-medium mt-1">Manage contracts and progress payments</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
             <h3 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 pb-3 mb-4">Budget Utilization</h3>
             <div className="mb-4">
                <div className="flex justify-between items-end text-[12px] mb-2">
                  <span className="font-bold text-muted-foreground">Total Budget Used</span>
                  <span className="font-bold font-mono">{utilizationPercent}%</span>
                </div>
                <ProgressBar value={totalSpent} max={budgetEstimate || 1} height={10} />
             </div>
             
             <div className="space-y-3 mt-6">
                {spendingByCategory.map((cat: any) => (
                  <div key={cat.category} className="flex justify-between items-center p-3 border border-border/10 rounded-lg">
                    <span className="text-[13px] font-bold uppercase">{cat.category}</span>
                    <span className="font-mono text-[13px] font-bold">{fmt(cat.amount)}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>

        {/* Right Column: Alerts & AI */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-card to-accent/20 border border-border/20 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" /> AI Insights
            </h3>
            
            <div className="space-y-4">
               {balance < budgetEstimate * 0.1 && (
                 <div className="p-4 bg-danger-subtle/50 border border-danger/20 rounded-xl">
                   <p className="text-[12px] font-bold text-danger mb-1">Critical Cash Reserve</p>
                   <p className="text-[11px] text-danger/80 font-medium leading-relaxed">Wallet balance is below 10% of total budget. Recommend requesting additional funding allocation immediately.</p>
                 </div>
               )}
               {utilizationPercent > 80 && (
                 <div className="p-4 bg-warning-subtle/50 border border-warning/20 rounded-xl">
                   <p className="text-[12px] font-bold text-warning mb-1">Budget Warning</p>
                   <p className="text-[11px] text-warning/80 font-medium leading-relaxed">Project has consumed {utilizationPercent}% of its total budget estimate.</p>
                 </div>
               )}
               <div className="p-4 bg-background border border-border/10 rounded-xl">
                 <p className="text-[12px] font-bold text-foreground mb-1">Procurement Velocity</p>
                 <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Average bill payment time is 4.2 days. 3 POs are awaiting goods receipt.</p>
               </div>
            </div>
          </div>

          <div className="bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
             <h3 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 pb-3 mb-4">Pending Approvals</h3>
             <div className="text-center py-8">
               <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
               <p className="text-[13px] font-bold text-muted-foreground">No pending items</p>
               <p className="text-[11px] text-muted-foreground/70 mt-1">All purchase requests are approved</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
