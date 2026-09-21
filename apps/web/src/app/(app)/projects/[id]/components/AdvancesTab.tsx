'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, AlertCircle, Banknote, Calendar, User as UserIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { invalidateFinancials } from '@/lib/invalidate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Advance {
  id: string;
  amount: number | string;
  description: string;
  referenceNo?: string | null;
  receivedDate: string;
  status: string;
  notes?: string | null;
  receivedBy?: { firstName: string; lastName: string } | null;
}

const advanceSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  description: z.string().min(2, 'Describe what this advance is for'),
  referenceNo: z.string().optional(),
  receivedDate: z.string().min(1, 'Received date is required'),
  notes: z.string().optional(),
});

type AdvanceFormValues = z.infer<typeof advanceSchema>;

const money = (n: number) => `LKR ${Number(n).toLocaleString()}`;

export function AdvancesTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data: advances, isLoading } = useQuery<Advance[]>({
    queryKey: ['advances', projectId],
    queryFn: async () => (await apiClient.get(`/projects/${projectId}/advances`)).data,
  });

  // No generic here on purpose: z.coerce.number() gives the schema a
  // different input type (unknown) from its output type (number), which
  // react-hook-form's resolver generics reject.
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      amount: 0, description: '', referenceNo: '',
      receivedDate: new Date().toISOString().split('T')[0], notes: '',
    },
  });

  const createAdvance = useMutation({
    mutationFn: async (values: AdvanceFormValues) =>
      (await apiClient.post(`/projects/${projectId}/advances`, values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances', projectId] });
      // An advance becomes a funding source, so the money views move too.
      invalidateFinancials(queryClient);
      setIsOpen(false);
      reset();
      setMutateError(null);
    },
    onError: (err: any) =>
      setMutateError(err.response?.data?.message ?? 'Could not record the advance. Please try again.'),
  });

  const list = advances ?? [];
  const total = list.reduce((sum, a) => sum + Number(a.amount), 0);

  const inputCls =
    'h-10 rounded-xl border-border/40 bg-background/40 text-sm font-semibold';

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground/90">Customer Advances</h3>
          <p className="text-[13px] text-muted-foreground/65 font-medium">
            Money received from the client up front. Each advance becomes a funding source you can spend against.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setMutateError(null); }}>
          <DialogTrigger asChild>
            <Button className="font-semibold h-10 rounded-xl text-xs px-4">
              <Plus className="w-4 h-4 mr-1.5" aria-hidden /> Record Advance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Record customer advance</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Adds the amount to this project&apos;s available funds.
              </DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertDescription className="text-xs font-medium">{mutateError}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit(async (v) => {
                setMutateError(null);
                await createAdvance.mutateAsync(v as AdvanceFormValues).catch(() => {});
              })}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="adv-amount" className="text-xs font-semibold">Amount (LKR) *</Label>
                <Input id="adv-amount" type="number" step="0.01" min="0" className={inputCls} {...register('amount')} />
                {errors.amount && <p className="text-[11px] font-semibold text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adv-desc" className="text-xs font-semibold">Description *</Label>
                <Input id="adv-desc" placeholder="e.g. Mobilization advance" className={inputCls} {...register('description')} />
                {errors.description && <p className="text-[11px] font-semibold text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adv-date" className="text-xs font-semibold">Received on *</Label>
                  <Input id="adv-date" type="date" className={inputCls} {...register('receivedDate')} />
                  {errors.receivedDate && <p className="text-[11px] font-semibold text-destructive">{errors.receivedDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adv-ref" className="text-xs font-semibold">Reference no.</Label>
                  <Input id="adv-ref" placeholder="Cheque / slip no." className={inputCls} {...register('referenceNo')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adv-notes" className="text-xs font-semibold">Notes</Label>
                <Input id="adv-notes" className={inputCls} {...register('notes')} />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold"
                  onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording…' : 'Record advance'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {list.length > 0 && (
        <Card className="glass-panel rounded-2xl border-border/25">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/55 font-mono">
              Total advances received
            </span>
            <span className="text-[17px] font-bold font-mono text-foreground/90">{money(total)}</span>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-[13px] text-muted-foreground/60 font-medium py-8 text-center">Loading advances…</p>
      ) : list.length === 0 ? (
        <Card className="glass-panel rounded-2xl border-border/25 border-dashed">
          <CardContent className="p-10 text-center">
            <Banknote className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" aria-hidden />
            <p className="text-[14px] font-semibold text-foreground/80">No advances recorded yet</p>
            <p className="text-[13px] text-muted-foreground/60 font-medium mt-1">
              Record money the client pays up front so it is available to spend against this project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <Card key={a.id} className="glass-panel rounded-xl border-border/25">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-foreground/90">{a.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-medium text-muted-foreground/60">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden />
                      {new Date(a.receivedDate).toLocaleDateString()}
                    </span>
                    {a.referenceNo && <span className="font-mono">Ref {a.referenceNo}</span>}
                    {a.receivedBy && (
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="w-3 h-3" aria-hidden />
                        {a.receivedBy.firstName} {a.receivedBy.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[15px] font-bold font-mono text-success whitespace-nowrap">
                  + {money(Number(a.amount))}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
