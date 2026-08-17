'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import { ProgressBar } from '@/components/ui/custom-charts';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function ProjectsTab({ 
  data, 
  onDrillDown 
}: { 
  data: any, 
  onDrillDown: (type: string, payload?: any) => void 
}) {
  if (!data) return null;
  const { projectBreakdown } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Project Portfolios</h2>
          <p className="text-[13px] text-muted-foreground font-medium mt-1">Select a project to enter its dedicated financial workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projectBreakdown.map((p: any) => (
          <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-elevated group" onClick={() => onDrillDown('PROJECT', p)}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Building2 className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[16px] leading-none">{p.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-mono mt-1.5">{p.code}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end text-[12px]">
                  <div>
                    <span className="text-muted-foreground/80 font-bold block mb-1">Budget Consumed</span>
                    <span className="font-bold font-mono text-[15px]">{fmt(p.totalSpent)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground/80 font-bold block mb-1">Total Budget</span>
                    <span className="font-semibold font-mono text-muted-foreground">{fmt(p.budgetEstimate)}</span>
                  </div>
                </div>
                
                <ProgressBar value={p.totalSpent} max={p.budgetEstimate || 1} height={6} />
                
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className={`${p.budgetUtilization > 100 ? 'text-danger' : 'text-success'}`}>
                    {p.budgetUtilization}% utilized
                  </span>
                  <span className="text-primary">{p.workDonePercent}% complete</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-border/10">
                <div className="bg-accent/30 p-3 rounded-xl border border-border/10">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Income</p>
                  <p className="font-mono text-[13px] font-bold text-success">+{fmt(p.totalAdvance)}</p>
                </div>
                <div className="bg-accent/30 p-3 rounded-xl border border-border/10">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Balance</p>
                  <p className="font-mono text-[13px] font-bold text-primary">{fmt(p.balance)}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 flex justify-end items-center text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                Open Workspace <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
