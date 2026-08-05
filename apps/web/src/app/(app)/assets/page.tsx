'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus, AlertCircle, HardHat, Calendar, Building2, Search, Tool, Car
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

const assetSchema = z.object({
  name: z.string().min(3, 'Asset name is required'),
  purchasePrice: z.coerce.number().min(0, 'Price must be positive or 0'),
  category: z.enum(['MACHINERY', 'VEHICLE', 'EQUIPMENT', 'TOOLS', 'IT_EQUIPMENT', 'OTHER']).default('EQUIPMENT'),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'MAINTENANCE', 'RETIRED']).default('NEW'),
  currentProjectId: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

const fmt = (n: number) => `LKR ${n.toLocaleString()}`;

const inputCls = 'flex h-9 w-full rounded-xl border border-border/40 bg-accent/20 px-3 py-1.5 text-[13px] outline-none focus:border-foreground/30 focus:ring-2 focus:ring-ring/20 font-medium transition-all';

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data: assetsData, isLoading } = useQuery<any[]>({
    queryKey: ['assets'],
    queryFn: async () => (await apiClient.get('/assets')).data,
    retry: 1,
  });

  const { data: projectsData } = useQuery<{ data: any[] }>({
    queryKey: ['projects', 'ALL'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  const createAssetMutation = useMutation({
    mutationFn: async (values: AssetFormValues) => {
      // Send as-is
      return (await apiClient.post('/assets', values)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDialogOpen(false);
      resetForm();
      setMutateError(null);
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message ?? 'Failed to add asset.');
    },
  });

  const { register, handleSubmit, reset: resetForm, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      purchasePrice: 0,
      category: 'EQUIPMENT' as const,
      condition: 'NEW' as const,
      currentProjectId: '',
      serialNumber: '',
      notes: '',
    },
  });

  const assets = assetsData ?? [];
  const projects = projectsData?.data ?? [];

  return (
    <div className="space-y-5 pb-12" aria-label="Assets">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="text-left select-none">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground/90">
            Assets & Equipment
          </h1>
          <p className="text-[13px] text-muted-foreground/65 mt-0.5 font-medium">
            Manage your machinery, vehicles, and long-term equipment.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" aria-hidden />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border/25 rounded-2xl shadow-modal text-left">
            <DialogHeader className="border-b border-border/15 pb-4 mb-4">
              <DialogTitle className="text-[15px] font-bold">Add New Asset</DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground/65 mt-0.5">
                Register a new asset and optionally assign it to a project.
              </DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert className="bg-danger-subtle border-danger/25 rounded-xl mb-4">
                <AlertCircle className="h-4 w-4 text-danger" aria-hidden />
                <AlertTitle className="text-[11px] font-bold uppercase tracking-wider text-danger">Error</AlertTitle>
                <AlertDescription className="text-[12px] text-danger/80">{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit((v) => { setMutateError(null); createAssetMutation.mutate(v); })} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-foreground/80">
                  Asset Name <span className="text-danger">*</span>
                </Label>
                <Input placeholder="e.g. Caterpillar Excavator 320" {...register('name')} className={inputCls} />
                {errors.name && <p className="text-[11px] text-danger font-semibold">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">
                    Purchase Price (LKR)
                  </Label>
                  <Input type="number" min="0" placeholder="15000000" {...register('purchasePrice')} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">Serial / Reg Number</Label>
                  <Input placeholder="e.g. CAT-320-1234" {...register('serialNumber')} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">Category</Label>
                  <select className={inputCls} {...register('category')}>
                    <option value="MACHINERY">Machinery</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="TOOLS">Tools</option>
                    <option value="IT_EQUIPMENT">IT Equipment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-foreground/80">Condition</Label>
                  <select className={inputCls} {...register('condition')}>
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="MAINTENANCE">In Maintenance</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-foreground/80">
                  Assign to Project (Optional)
                </Label>
                <select className={inputCls} {...register('currentProjectId')}>
                  <option value="">-- Leave Unassigned --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-foreground/80">Notes</Label>
                <Input placeholder="Any additional information..." {...register('notes')} className={inputCls} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/15">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} loadingText="Saving…">
                  Save Asset
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <SkeletonList items={5} />
      ) : assets.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border/20 rounded-2xl shadow-surface">
          <HardHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No assets found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add your company's equipment, machinery, and vehicles here.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">Add First Asset</Button>
        </div>
      ) : (
        <div className="bg-card border border-border/25 rounded-2xl overflow-hidden shadow-surface text-left">
          <div className="flex items-center gap-4 px-5 py-3 border-b border-border/20 bg-accent/20">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Asset Name</span>
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-32">Condition</span>
            <span className="hidden lg:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-48">Location/Project</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-24 text-right">Value</span>
          </div>
          {assets.map(a => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/10 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-foreground/90 truncate">{a.name}</p>
                <p className="text-[11px] font-bold text-muted-foreground/50 font-mono mt-0.5">
                  {a.category} {a.serialNumber ? `· S/N: ${a.serialNumber}` : ''}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-1.5 w-32 text-[12px] text-muted-foreground">
                <span className={cn(
                  'chip text-[9px]',
                  a.condition === 'NEW' || a.condition === 'GOOD' ? 'bg-success-subtle text-success border-success/20' :
                  a.condition === 'FAIR' ? 'bg-info-subtle text-info border-info/20' :
                  'bg-warning-subtle text-warning border-warning/20'
                )}>
                  {a.condition}
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 w-48 text-[12px] text-muted-foreground/80 font-medium truncate">
                {a.currentProject ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    <span className="truncate">{a.currentProject.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/50 italic">Unassigned (Yard)</span>
                )}
              </div>
              <div className="w-24 text-right">
                <span className="text-[13px] font-semibold text-foreground/90 font-mono">{fmt(a.purchasePrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
