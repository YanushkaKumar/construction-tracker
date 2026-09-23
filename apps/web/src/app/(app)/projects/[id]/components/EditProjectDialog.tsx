'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Loader2, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { invalidateFinancials } from '@/lib/invalidate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Budgets are set when a project is created and then never revisited — an
 * estimate written before work started is usually wrong by the second month,
 * and there was no way to correct it.
 *
 * Only what the site team owns is editable here. `budgetActual` is the sum of
 * what has actually been spent and is maintained by the finance flows, so it
 * is shown for context but never sent.
 */

const schema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  location: z.string().optional(),
  clientName: z.string().optional(),
  budgetEstimate: z.coerce.number().min(0, 'Budget cannot be negative'),
  contractValue: z.coerce.number().min(0, 'Contract value cannot be negative'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().optional(),
});

interface EditableProject {
  id: string;
  name: string;
  location?: string;
  clientName?: string;
  budgetEstimate: number;
  budgetActual: number;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  priority: string;
  description?: string;
}

const money = (n: number) => `LKR ${Number(n || 0).toLocaleString()}`;
const dateOnly = (v?: string) => (v ? v.slice(0, 10) : '');

export function EditProjectDialog({ project }: { project: EditableProject }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      location: project.location ?? '',
      clientName: project.clientName ?? '',
      budgetEstimate: Number(project.budgetEstimate ?? 0),
      contractValue: Number(project.contractValue ?? 0),
      startDate: dateOnly(project.startDate),
      endDate: dateOnly(project.endDate),
      priority: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(project.priority)
        ? project.priority
        : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      description: project.description ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      // A field the user cleared is sent as null so it is actually cleared.
      // Sending "" fails validation, and omitting it would silently keep the
      // old value — which would make "leave blank for an ongoing project"
      // untrue the moment an end date had ever been set.
      const orNull = (v?: string) => (v && v.trim() ? v.trim() : null);

      const payload = {
        name: values.name.trim(),
        budgetEstimate: values.budgetEstimate,
        contractValue: values.contractValue,
        priority: values.priority,
        location: orNull(values.location),
        clientName: orNull(values.clientName),
        description: orNull(values.description),
        startDate: orNull(values.startDate),
        endDate: orNull(values.endDate),
      };
      return (await apiClient.patch(`/projects/${project.id}`, payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      invalidateFinancials(qc);
      setOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not save the project');
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);
    // mutateAsync keeps isPending true for the whole request, so the button
    // stays disabled and a second click cannot submit the form twice.
    try {
      await save.mutateAsync(values);
    } catch {
      /* surfaced through onError */
    }
  };

  const spent = Number(project.budgetActual ?? 0);
  const newBudget = Number(watch('budgetEstimate') || 0);
  const belowSpend = newBudget > 0 && newBudget < spent;

  const inputCls = 'h-10 rounded-xl border-border/40 bg-background/40 text-sm font-semibold';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) { reset(); setError(null); }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl h-9 text-xs font-bold">
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Edit Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the budget and details. Spending already recorded is not changed.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="ep-name" className="text-[12px] font-semibold text-foreground/80">Project name</Label>
            <Input id="ep-name" className={inputCls} {...register('name')} />
            {errors.name && <p className="text-[11px] font-semibold text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-budget" className="text-[12px] font-semibold text-foreground/80">Budget estimate (LKR)</Label>
              <Input id="ep-budget" type="number" step="0.01" min="0" className={inputCls} {...register('budgetEstimate')} />
              {errors.budgetEstimate && <p className="text-[11px] font-semibold text-destructive">{errors.budgetEstimate.message}</p>}
              <p className="text-[11px] text-muted-foreground/70 font-medium">
                Already spent: <span className="tabular-nums font-semibold">{money(spent)}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-contract" className="text-[12px] font-semibold text-foreground/80">Contract value (LKR)</Label>
              <Input id="ep-contract" type="number" step="0.01" min="0" className={inputCls} {...register('contractValue')} />
              {errors.contractValue && <p className="text-[11px] font-semibold text-destructive">{errors.contractValue.message}</p>}
            </div>
          </div>

          {belowSpend && (
            <p className="text-[11px] font-semibold text-warning" role="status">
              This budget is below the {money(spent)} already spent — the project will show as over budget.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-start" className="text-[12px] font-semibold text-foreground/80">Start date</Label>
              <Input id="ep-start" type="date" className={inputCls} {...register('startDate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-end" className="text-[12px] font-semibold text-foreground/80">End date</Label>
              <Input id="ep-end" type="date" className={inputCls} {...register('endDate')} />
              <p className="text-[11px] text-muted-foreground/70 font-medium">Leave blank for an ongoing project.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-client" className="text-[12px] font-semibold text-foreground/80">Client</Label>
              <Input id="ep-client" className={inputCls} {...register('clientName')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-priority" className="text-[12px] font-semibold text-foreground/80">Priority</Label>
              <select id="ep-priority" className={`${inputCls} w-full px-3`} {...register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-location" className="text-[12px] font-semibold text-foreground/80">Location</Label>
            <Input id="ep-location" className={inputCls} {...register('location')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-desc" className="text-[12px] font-semibold text-foreground/80">Description</Label>
            <Input id="ep-desc" className={inputCls} {...register('description')} />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border/15">
            <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl h-9 text-xs font-bold" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
