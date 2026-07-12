'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Loader2, AlertCircle, Trash2, TrendingUp, Calculator, Percent, FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const sectionSchema = z.object({
  title: z.string().min(2, 'Required'),
});

const itemSchema = z.object({
  itemNo: z.string().min(1, 'Required'),
  description: z.string().min(2, 'Required'),
  unit: z.string().min(1, 'Required'),
  quantity: z.coerce.number().min(0.01, 'Must be positive'),
  rate: z.coerce.number().min(0.01, 'Must be positive'),
  remarks: z.string().optional(),
});

const actualSchema = z.object({
  actualQty: z.coerce.number().min(0, 'Must be positive'),
  actualAmount: z.coerce.number().min(0, 'Must be positive'),
});

const fmt = (n: number) => `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export function BOQTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [secDlg, setSecDlg] = useState(false);
  const [itemDlg, setItemDlg] = useState<string | null>(null);
  const [actualDlg, setActualDlg] = useState<any | null>(null);
  const [secErr, setSecErr] = useState<string | null>(null);
  const [itemErr, setItemErr] = useState<string | null>(null);
  const [actualErr, setActualErr] = useState<string | null>(null);

  const { data: boqData, isLoading } = useQuery<any>({
    queryKey: ['project-boq', projectId],
    queryFn: async () => (await apiClient.get(`/projects/${projectId}/boq`)).data,
  });

  const secForm = useForm({ resolver: zodResolver(sectionSchema), defaultValues: { title: '' } });
  const itemForm = useForm({ resolver: zodResolver(itemSchema), defaultValues: { itemNo: '', description: '', unit: 'm3', quantity: 0, rate: 0, remarks: '' } });
  const actualForm = useForm({ resolver: zodResolver(actualSchema), defaultValues: { actualQty: 0, actualAmount: 0 } });

  const createSec = useMutation({
    mutationFn: async (v: any) => (await apiClient.post(`/projects/${projectId}/boq/sections`, v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-boq', projectId] }); setSecDlg(false); secForm.reset(); },
    onError: (e: any) => setSecErr(e.response?.data?.message || 'Failed to create section'),
  });

  const createItem = useMutation({
    mutationFn: async (v: any) => (await apiClient.post(`/boq/sections/${itemDlg}/items`, { ...v, projectId })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-boq', projectId] }); setItemDlg(null); itemForm.reset(); },
    onError: (e: any) => setItemErr(e.response?.data?.message || 'Failed to add item'),
  });

  const updateActual = useMutation({
    mutationFn: async (v: any) => (await apiClient.patch(`/boq/items/${actualDlg.id}`, v)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-boq', projectId] }); setActualDlg(null); actualForm.reset(); },
    onError: (e: any) => setActualErr(e.response?.data?.message || 'Failed to update progress'),
  });

  const delSec = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/boq/sections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-boq', projectId] }),
  });

  const delItem = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/boq/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-boq', projectId] }),
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const sections = boqData?.sections || [];
  const summary = boqData?.summary || { totalEstimated: 0, totalActual: 0, totalItems: 0 };

  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left select-none">
        <Card className="glass-panel border-border/30 shadow-surface">
          <CardContent className="p-4 flex items-center justify-between font-semibold">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider font-mono">Estimated BOQ Total</p>
              <p className="text-[24px] lg:text-[28px] font-semibold text-foreground/90 tracking-tight mt-0.5 text-financial font-mono">{fmt(summary.totalEstimated)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent/40 border border-border/25 text-muted-foreground/65 flex items-center justify-center shadow-sm"><Calculator className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/30 shadow-surface">
          <CardContent className="p-4 flex items-center justify-between font-semibold">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider font-mono">Actual Spent BOQ</p>
              <p className="text-[24px] lg:text-[28px] font-semibold text-success tracking-tight mt-0.5 text-financial font-mono">{fmt(summary.totalActual)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-success-subtle border border-success/30 text-success flex items-center justify-center shadow-sm"><TrendingUp className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/30 shadow-surface">
          <CardContent className="p-4 flex items-center justify-between font-semibold">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider font-mono">Variance</p>
              <p className={`text-[24px] lg:text-[28px] font-semibold tracking-tight mt-0.5 text-financial font-mono ${summary.variance >= 0 ? 'text-success' : 'text-danger'}`}>
                {fmt(Math.abs(summary.variance))} 
                <span className="text-[11px] font-semibold ml-1 uppercase tracking-wide">({summary.variance >= 0 ? 'Under' : 'Over'})</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent/40 border border-border/25 text-muted-foreground/65 flex items-center justify-center shadow-sm"><Percent className="w-5 h-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* BOQ Table / Sections Header */}
      <div className="flex justify-between items-center bg-card/65 backdrop-blur-xl p-4 rounded-2xl border border-border/25 shadow-surface text-left select-none">
        <div>
          <h2 className="text-[18px] lg:text-[20px] font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-foreground/75" /> Project Bill of Quantities
          </h2>
          <p className="text-[13px] text-muted-foreground font-semibold mt-0.5">Structured estimate breakdown and actual performance tracking</p>
        </div>
        <Dialog open={secDlg} onOpenChange={setSecDlg}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold h-9 px-3.5 rounded-xl text-xs transition-all shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
            <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
              <DialogTitle className="text-sm font-bold">Add BOQ Section</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">Create a new work category segment (e.g., Earth Works, Concrete Works).</DialogDescription>
            </DialogHeader>
            {secErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{secErr}</AlertDescription></Alert>}
            <form onSubmit={secForm.handleSubmit(v => { setSecErr(null); createSec.mutate(v); })} className="space-y-4 pt-1 font-semibold text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Section Title *</Label>
                <Input placeholder="e.g. Earth excavation" {...secForm.register('title')} className={inputStyle} />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/15">
                <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setSecDlg(false)}>Cancel</Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={createSec.isPending}>Save Section</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sections and Items List */}
      <div className="space-y-4">
        {sections.map((sec: any) => (
          <Card key={sec.id} className="border-border/25 rounded-2xl bg-card/45 backdrop-blur-xl overflow-hidden text-left shadow-sm">
            <div className="bg-accent/15 px-4 py-2 border-b border-border/25 flex items-center justify-between select-none">
              <h4 className="text-[13px] font-bold text-foreground">{sec.title}</h4>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="text-[11px] font-bold hover:bg-accent/40 rounded-lg text-foreground px-2 h-7" onClick={() => setItemDlg(sec.id)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-danger/70 hover:text-danger rounded-lg" onClick={() => delSec.mutate(sec.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] text-left border-collapse font-semibold">
                  <thead>
                    <tr className="bg-accent/5 text-[11px] font-bold text-muted-foreground/60 uppercase border-b border-border/20 font-mono select-none">
                      <th className="p-2.5 pl-3">Item No</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Unit</th>
                      <th className="p-2.5 text-right">Est Qty</th>
                      <th className="p-2.5 text-right">Est Rate</th>
                      <th className="p-2.5 text-right">Est Amount</th>
                      <th className="p-2.5 text-right text-success">Act Qty</th>
                      <th className="p-2.5 text-right text-success">Act Amount</th>
                      <th className="p-2.5 pr-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                        <td className="p-2.5 pl-3 text-muted-foreground font-mono">{item.itemNo}</td>
                        <td className="p-2.5 text-foreground max-w-xs truncate">{item.description}</td>
                        <td className="p-2.5 text-center text-muted-foreground/80 font-mono">{item.unit}</td>
                        <td className="p-2.5 text-right font-bold font-mono">{Number(item.quantity).toLocaleString()}</td>
                        <td className="p-2.5 text-right text-muted-foreground/75 font-normal font-mono">{Number(item.rate).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-semibold text-foreground font-mono">{Number(item.amount).toLocaleString()}</td>
                        <td className="p-2.5 text-right text-success font-bold font-mono">{item.actualQty ? Number(item.actualQty).toLocaleString() : '-'}</td>
                        <td className="p-2.5 text-right text-success font-semibold font-mono">{item.actualAmount ? Number(item.actualAmount).toLocaleString() : '-'}</td>
                        <td className="p-2.5 pr-3 text-center">
                          <div className="flex justify-center gap-1.5 select-none">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-success hover:text-success hover:bg-success/10 rounded-lg" onClick={() => { setActualDlg(item); actualForm.reset({ actualQty: Number(item.actualQty || 0), actualAmount: Number(item.actualAmount || 0) }); }}>
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-lg" onClick={() => delItem.mutate(item.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sec.items.length === 0 && (
                      <tr><td colSpan={9} className="p-4 text-center text-[15px] font-normal text-muted-foreground/60 italic select-none">No estimation items in this section.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={!!itemDlg} onOpenChange={() => setItemDlg(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
          <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
            <DialogTitle className="text-sm font-bold">Add BOQ Item</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Define estimated quantities and rates for this section item.</DialogDescription>
          </DialogHeader>
          {itemErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{itemErr}</AlertDescription></Alert>}
          <form onSubmit={itemForm.handleSubmit(v => { setItemErr(null); createItem.mutate(v); })} className="space-y-4 pt-1 font-semibold text-left">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label className="text-xs font-semibold text-foreground/80">Item No *</Label>
                <Input placeholder="e.g. 1.1" {...itemForm.register('itemNo')} className={inputStyle} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-foreground/80">Description *</Label>
                <Input placeholder="Excavation in soft soil" {...itemForm.register('description')} className={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground/80">Unit *</Label>
                <Input placeholder="m3" {...itemForm.register('unit')} className={inputStyle} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground/80">Est Qty *</Label>
                <Input type="number" step="any" {...itemForm.register('quantity')} className={inputStyle} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground/80">Est Rate *</Label>
                <Input type="number" step="any" {...itemForm.register('rate')} className={inputStyle} />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/15">
              <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setItemDlg(null)}>Cancel</Button>
              <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={createItem.isPending}>Add Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Actual progress Dialog */}
      <Dialog open={!!actualDlg} onOpenChange={() => setActualDlg(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-card border border-border/30 p-5 text-left shadow-elevated">
          <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
            <DialogTitle className="text-sm font-bold">Update Actual Progress</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Log actual quantities and expenditures incurred in operations.</DialogDescription>
          </DialogHeader>
          {actualErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{actualErr}</AlertDescription></Alert>}
          <form onSubmit={actualForm.handleSubmit(v => { setActualErr(null); updateActual.mutate(v); })} className="space-y-4 pt-1 font-semibold text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80 font-mono">Actual Qty ({actualDlg?.unit})</Label>
              <Input type="number" step="any" {...actualForm.register('actualQty')} className={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80 font-mono">Actual Cost (LKR)</Label>
              <Input type="number" step="any" {...actualForm.register('actualAmount')} className={inputStyle} />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/15">
              <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setActualDlg(null)}>Cancel</Button>
              <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold" disabled={updateActual.isPending}>Update Progress</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
