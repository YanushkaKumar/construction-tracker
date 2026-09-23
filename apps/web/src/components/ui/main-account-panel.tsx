'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Coins, Loader2, ShieldAlert } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/**
 * Replaces the funding allocation builder.
 *
 * Every payment now comes out of the company's single Main Account, so there
 * is nothing to choose: this just shows what is in the account and whether it
 * covers what is being spent. The old builder asked the user to split a cost
 * across funding pools — a decision they had no basis to make, and which let
 * the same rupee appear available in two places.
 */

interface MainAccount {
  id: string;
  name: string;
  currentBalance: number;
}

const fmt = (n: number) =>
  `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export function MainAccountPanel({ totalAmount }: { totalAmount: number }) {
  const { data: account, isLoading } = useQuery<MainAccount>({
    queryKey: ['funding-sources', 'main'],
    queryFn: async () => (await apiClient.get('/funding-sources/main')).data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border border-border/25 bg-accent/15">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
        <span className="text-[12px] text-muted-foreground/70 font-medium">
          Loading account balance…
        </span>
      </div>
    );
  }

  const balance = Number(account?.currentBalance ?? 0);
  const amount = Number.isFinite(totalAmount) ? totalAmount : 0;
  const short = amount > balance;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border bg-accent/15',
        short ? 'border-danger/30' : 'border-border/25',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Coins className="w-4 h-4 text-warning" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-foreground/90">
              Paid from {account?.name ?? 'Main Account'}
            </p>
            <p className="text-[11px] text-muted-foreground/65 font-medium mt-0.5">
              All company funding is held here.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/55 font-semibold">
            Available
          </p>
          <p
            className={cn(
              'text-[15px] font-semibold tabular-nums',
              short ? 'text-danger' : 'text-foreground/90',
            )}
          >
            {fmt(balance)}
          </p>
        </div>
      </div>

      {amount > 0 && (
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border/15">
          <span className="text-[11px] font-medium text-muted-foreground/70">
            This payment
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-foreground/85">
            {fmt(amount)}
          </span>
        </div>
      )}

      {short && (
        <div
          className="flex items-start gap-2 mt-3 text-[11px] font-medium text-danger"
          role="alert"
        >
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden />
          <span>
            Short by {fmt(amount - balance)}. Add funding under Finance before
            recording this.
          </span>
        </div>
      )}
    </div>
  );
}
