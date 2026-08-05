'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus, AlertCircle, ShoppingCart, Calendar, Building2, MapPin, Search, Receipt
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SkeletonList } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const purchaseSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  totalAmount: z.coerce.number().min(1, 'Amount must be positive'),
  category: z.enum(['MATERIAL', 'EQUIPMENT', 'SUBCONTRACT', 'SERVICE', 'OTHER']).default('MATERIAL'),
  purchaseDate: z.string(),
  vendor: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  registerAsAsset: z.boolean().default(false),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const fmt = (n: number) => `LKR ${n.toLocaleString()}`;

const inputCls = 'flex h-9 w-full rounded-xl border border-border/40 bg-accent/20 px-3 py-1.5 text-[13px] outline-none focus:border-foreground/30 focus:ring-2 focus:ring-ring/20 font-medium transition-all';

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data: purchasesData, isLoading } = useQuery<any[]>({
    queryKey: ['purchases'],
    queryFn: async () => (await apiClient.get('/purchases')).data,
    retry: 1,
  });

  const { data: projectsData } = useQuery<{ data: any[] }>({
    queryKey: ['projects', 'ALL'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (values: PurchaseFormValues) => {
      const { projectId, ...rest } = values;
      const data = {
        ...rest,
        allocations: [
          {
            projectId,
            amount: values.totalAmount,
            percentage: 100
          }
        ]
      };
      return (await apiClient.post('/purchases', data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDialogOpen(false);
      resetForm();
      setMutateError(null);
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message ?? 'Failed to add purchase.');
    },
  });

  const { register, handleSubmit, reset: resetForm, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      title: '',
      totalAmount: 0,
      category: 'MATERIAL' as const,
      purchaseDate: new Date().toISOString().split('T')[0],
      vendor: '',
      projectId: '',
      registerAsAsset: false,
    },
  });

  const purchases = purchasesData ?? [];
  const projects = projectsData?.data ?? [];

  return (
    <div className="space-y-5 pb-12" aria-label="Purchases">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="text-left select-none">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground/90">
            Purchases & Procurement
          </h1>
          <p className="text-[13px] text-muted-foreground/65 mt-0.5 font-medium">
            Manage your purchases, materials, and expenses.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" aria-hidden />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border/25 rounded-2xl shadow-modal text-left">
            <DialogHeader className="border-b border-border/15 pb-4 mb-4">
              <DialogTitle className="text-[15px] font-bold">Add New Purchase</DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground/65 mt-0.5">
                Record a new purchase and allocate it to a project.
              </DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert className="bg-danger-subtle border-danger/25 rounded-xl mb-4">
                <AlertCircle className="h-4 w-4 text-danger" aria-hidden />
                <AlertTitle className="text-[11px] font-bold uppercase tracking-wider text-danger">Error</AlertTitle>
                <AlertDescription className="text-[12px] text-danger/80">{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit((v) => { setMutateError(null); createPurchaseMutation.mutate(v); })} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-foreground/80">
                  What did you buy? <span className="text-danger">*</span>
                </Label>
                <Input placeholder="e.g. 50 bags of Cement" {...register('title')} className={inputCls} />
                {errors.title && <p className="text-[11px] text-danger font-semibold">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">
                    Total Amount (LKR) <span className="text-danger">*</span>
                  </Label>
                  <Input type="number" min="0" placeholder="5000" {...register('totalAmount')} className={inputCls} />
                  {errors.totalAmount && <p className="text-[11px] text-danger font-semibold">{errors.totalAmount.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">Date</Label>
                  <Input type="date" {...register('purchaseDate')} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">Category</Label>
                  <select className={inputCls} {...register('category')}>
                    <option value="MATERIAL">Materials</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="SUBCONTRACT">Subcontractor</option>
                    <option value="SERVICE">Service</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">Vendor (Optional)</Label>
                  <Input placeholder="e.g. Hardware Store" {...register('vendor')} className={inputCls} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-foreground/80">
                  Allocate to Project <span className="text-danger">*</span>
                </Label>
                <select className={inputCls} {...register('projectId')}>
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.projectId && <p className="text-[11px] text-danger font-semibold">{errors.projectId.message}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="registerAsAsset" {...register('registerAsAsset')} className="rounded border-border bg-accent/20 text-primary focus:ring-primary h-4 w-4" />
                <Label htmlFor="registerAsAsset" className="text-[12px] font-medium cursor-pointer">Register this purchase as a long-term Asset</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/15">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} loadingText="Saving…">
                  Save Purchase
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <SkeletonList items={5} />
      ) : purchases.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border/20 rounded-2xl shadow-surface">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No purchases yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Record your first purchase to start tracking expenses.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">Add First Purchase</Button>
        </div>
      ) : (
        <div className="bg-card border border-border/25 rounded-2xl overflow-hidden shadow-surface text-left">
          <div className="flex items-center gap-4 px-5 py-3 border-b border-border/20 bg-accent/20">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Item</span>
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-32">Date</span>
            <span className="hidden lg:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-48">Project</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-24 text-right">Amount</span>
          </div>
          {purchases.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/10 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-foreground/90 truncate">{p.title}</p>
                <p className="text-[11px] font-bold text-muted-foreground/50 font-mono mt-0.5">
                  {p.category} {p.vendor ? `· ${p.vendor}` : ''}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-1.5 w-32 text-[12px] text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(p.purchaseDate).toLocaleDateString()}
              </div>
              <div className="hidden lg:flex items-center gap-1.5 w-48 text-[12px] text-muted-foreground/80 font-medium truncate">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{p.allocations?.[0]?.project?.name ?? 'N/A'}</span>
              </div>
              <div className="w-24 text-right">
                <span className="text-[13px] font-semibold text-foreground/90 font-mono">{fmt(p.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
