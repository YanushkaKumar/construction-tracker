'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ShieldAlert, Coins, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface FundingSource {
  id: string;
  type: string;
  name: string;
  currentBalance: number;
  originalAmount: number;
  project?: { name: string; code: string };
}

interface Allocation {
  fundingSourceId: string;
  amount: number;
}

interface FundingAllocationBuilderProps {
  totalAmount: number;
  allocations: Allocation[];
  onChange: (allocations: Allocation[]) => void;
  projectId?: string;
}

const fmt = (n: number) => `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export function FundingAllocationBuilder({
  totalAmount,
  allocations,
  onChange,
  projectId,
}: FundingAllocationBuilderProps) {
  const { data: sources, isLoading } = useQuery<FundingSource[]>({
    queryKey: ['funding-sources', projectId],
    queryFn: async () => (await apiClient.get('/funding-sources', { params: { projectId } })).data,
  });

  const sourceList = sources ?? [];
  const currentTotal = allocations.reduce((acc, curr) => acc + curr.amount, 0);
  const isMatch = Math.abs(currentTotal - totalAmount) < 0.01;
  const isOverAllocated = currentTotal > totalAmount;

  // Track manual input values locally to avoid react-hook-form re-render latency
  const [localAmounts, setLocalAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Sync local state when external allocations change
    const initialMap: Record<string, string> = {};
    for (const alloc of allocations) {
      initialMap[alloc.fundingSourceId] = alloc.amount.toString();
    }
    setLocalAmounts(initialMap);
  }, [allocations]);

  const handleCheckboxToggle = (sourceId: string, balance: number) => {
    const exists = allocations.find(a => a.fundingSourceId === sourceId);
    let newAllocations: Allocation[] = [];

    if (exists) {
      newAllocations = allocations.filter(a => a.fundingSourceId !== sourceId);
      const copy = { ...localAmounts };
      delete copy[sourceId];
      setLocalAmounts(copy);
    } else {
      // Auto-fill remaining needed amount if possible, capped by available balance
      const remainingNeeded = Math.max(0, totalAmount - currentTotal);
      const fillAmount = Math.min(remainingNeeded, balance);
      newAllocations = [...allocations, { fundingSourceId: sourceId, amount: fillAmount }];
      setLocalAmounts(prev => ({ ...prev, [sourceId]: fillAmount.toString() }));
    }
    onChange(newAllocations);
  };

  const handleAmountChange = (sourceId: string, val: string, balance: number) => {
    setLocalAmounts(prev => ({ ...prev, [sourceId]: val }));

    const num = Number(val) || 0;
    const cleanNum = Math.min(num, balance); // Cap at available balance

    const exists = allocations.find(a => a.fundingSourceId === sourceId);
    let newAllocations: Allocation[] = [];

    if (exists) {
      newAllocations = allocations.map(a => 
        a.fundingSourceId === sourceId ? { ...a, amount: cleanNum } : a
      );
    } else {
      newAllocations = [...allocations, { fundingSourceId: sourceId, amount: cleanNum }];
    }
    onChange(newAllocations);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground/60 text-xs font-semibold select-none gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading funding pools...
      </div>
    );
  }

  return (
    <div className="space-y-3.5 bg-accent/5 border border-border/20 p-4 rounded-2xl select-none text-left">
      <div className="flex justify-between items-center pb-2 border-b border-border/15">
        <h4 className="text-[12px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 font-mono">
          <Coins className="w-4 h-4 text-amber-500" />
          Funding Allocation Builder
        </h4>
        <div className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
          isMatch ? 'bg-success-subtle/10 border-success/35 text-success' : 'bg-warning-subtle/10 border-warning/35 text-warning'
        )}>
          {isMatch ? 'Allocation Complete' : 'Pending Allocation'}
        </div>
      </div>

      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
        {sourceList.map(source => {
          const isChecked = allocations.some(a => a.fundingSourceId === source.id);
          const currentAlloc = allocations.find(a => a.fundingSourceId === source.id);
          const balance = Number(source.currentBalance);
          const isSourceOverAllocated = (currentAlloc?.amount || 0) > balance;

          return (
            <div 
              key={source.id} 
              className={cn(
                'flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200',
                isChecked ? 'bg-card border-border/60 shadow-sm' : 'bg-background/40 border-border/20 hover:border-border/40'
              )}
            >
              <div 
                className="flex items-start gap-2.5 cursor-pointer flex-1 py-1"
                onClick={() => handleCheckboxToggle(source.id, balance)}
              >
                <div className={cn(
                  'w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all',
                  isChecked ? 'bg-indigo-500 border-indigo-600 text-white' : 'border-border/40 bg-accent/5'
                )}>
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground leading-snug">{source.name}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-semibold font-mono uppercase mt-0.5">
                    {source.type.replace('_', ' ')} • {fmt(balance)} remaining
                  </p>
                </div>
              </div>

              {isChecked && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/45 font-bold font-mono">LKR</span>
                  <input
                    type="number"
                    value={localAmounts[source.id] ?? ''}
                    placeholder="0"
                    onChange={(e) => handleAmountChange(source.id, e.target.value, balance)}
                    className={cn(
                      "w-24 h-8 px-2 rounded-lg border bg-background/50 text-right text-xs outline-none focus-visible:border-foreground/30 font-semibold font-mono",
                      isSourceOverAllocated ? 'border-danger text-danger' : 'border-border/30'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}

        {sourceList.length === 0 && (
          <p className="text-xs text-muted-foreground/65 italic py-4 text-center">No available capital pools found.</p>
        )}
      </div>

      <div className={cn(
        'p-3 rounded-xl border flex items-center justify-between font-mono text-xs font-bold leading-none select-none',
        isMatch ? 'bg-success-subtle/10 border-success/20 text-success' : 'bg-warning-subtle/10 border-warning/20 text-warning'
      )}>
        <span className="text-[10px] uppercase text-muted-foreground/60 tracking-wider">Total Allocated:</span>
        <span>{fmt(currentTotal)} / {fmt(totalAmount)}</span>
      </div>

      {isOverAllocated && (
        <div className="bg-danger-subtle/10 border border-danger/20 text-danger p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Allocation total exceeds transaction amount!</span>
        </div>
      )}
    </div>
  );
}
