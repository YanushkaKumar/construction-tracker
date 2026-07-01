'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Loader2, AlertCircle, Trash2, Edit2, Check, X,
  FileSpreadsheet, TrendingUp, DollarSign, Calculator, Percent
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [itemDlg, setItemDlg] = useState<string | null>(null); // sectionId
  const [actualDlg, setActualDlg] = useState<any | null>(null); // item
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
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
  }

  const sections = boqData?.sections || [];
  const summary = boqData?.summary || { totalEstimated: 0, totalActual: 0, totalItems: 0 };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated BOQ Total</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{fmt(summary.totalEstimated)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center"><Calculator className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Actual Spent BOQ</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{fmt(summary.totalActual)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Variance</p>
              <p className={`text-2xl font-black mt-1 ${summary.variance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {fmt(Math.abs(summary.variance))} 
                <span className="text-xs font-semibold ml-1">({summary.variance >= 0 ? 'Under' : 'Over'})</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><Percent className="w-5 h-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* BOQ Table / Sections Header */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-violet-500" /> Project Bill of Quantities
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Structured estimate breakdown and actual performance tracking</p>
        </div>
        <Dialog open={secDlg} onOpenChange={setSecDlg}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Add BOQ Section</DialogTitle><DialogDescription>Create a new work section (e.g., Earth Works, Finishes).</DialogDescription></DialogHeader>
            {secErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{secErr}</AlertDescription></Alert>}
            <form onSubmit={secForm.handleSubmit(v => { setSecErr(null); createSec.mutate(v); })} className="space-y-4 pt-2">
              <div><Label className="text-xs font-semibold">Section Title *</Label><Input className="mt-1.5" placeholder="e.g. Concrete Works" {...secForm.register('title')} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => setSecDlg(false)}>Cancel</Button><Button type="submit" className="bg-violet-600 text-white rounded-xl" disabled={createSec.isPending}>Save Section</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sections and Items List */}
      <div className="space-y-6">
        {sections.map((sec: any) => (
          <Card key={sec.id} className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40 overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-950/20 p-4 border-b border-zinc-150 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{sec.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs text-violet-600 hover:bg-violet-50" onClick={() => setItemDlg(sec.id)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600" onClick={() => delSec.mutate(sec.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/20 dark:bg-zinc-950/10 text-xs font-bold text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800">
                      <th className="p-3">Item No</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Unit</th>
                      <th className="p-3 text-right">Est Qty</th>
                      <th className="p-3 text-right">Est Rate</th>
                      <th className="p-3 text-right">Est Amount</th>
                      <th className="p-3 text-right text-emerald-600">Act Qty</th>
                      <th className="p-3 text-right text-emerald-600">Act Amount</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/30">
                        <td className="p-3 font-semibold text-xs text-zinc-600">{item.itemNo}</td>
                        <td className="p-3 text-xs font-medium max-w-xs truncate">{item.description}</td>
                        <td className="p-3 text-xs text-center">{item.unit}</td>
                        <td className="p-3 text-xs text-right font-medium">{Number(item.quantity).toLocaleString()}</td>
                        <td className="p-3 text-xs text-right text-zinc-500">{Number(item.rate).toLocaleString()}</td>
                        <td className="p-3 text-xs text-right font-bold">{Number(item.amount).toLocaleString()}</td>
                        <td className="p-3 text-xs text-right text-emerald-600 font-medium">{item.actualQty ? Number(item.actualQty).toLocaleString() : '-'}</td>
                        <td className="p-3 text-xs text-right text-emerald-600 font-bold">{item.actualAmount ? Number(item.actualAmount).toLocaleString() : '-'}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-600" onClick={() => { setActualDlg(item); actualForm.reset({ actualQty: Number(item.actualQty || 0), actualAmount: Number(item.actualAmount || 0) }); }}>
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-600" onClick={() => delItem.mutate(item.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sec.items.length === 0 && (
                      <tr><td colSpan={9} className="p-4 text-center text-xs text-zinc-400">No items under this section. Click 'Add Item' to start.</td></tr>
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Add BOQ Item</DialogTitle><DialogDescription>Add a new estimated item to this section.</DialogDescription></DialogHeader>
          {itemErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{itemErr}</AlertDescription></Alert>}
          <form onSubmit={itemForm.handleSubmit(v => { setItemErr(null); createItem.mutate(v); })} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1"><Label className="text-xs font-semibold">Item No *</Label><Input className="mt-1.5" placeholder="e.g. 1.1" {...itemForm.register('itemNo')} /></div>
              <div className="col-span-2"><Label className="text-xs font-semibold">Description *</Label><Input className="mt-1.5" placeholder="Excavation in soft soil" {...itemForm.register('description')} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs font-semibold">Unit *</Label><Input className="mt-1.5" placeholder="m3" {...itemForm.register('unit')} /></div>
              <div><Label className="text-xs font-semibold">Est Qty *</Label><Input type="number" step="any" className="mt-1.5" {...itemForm.register('quantity')} /></div>
              <div><Label className="text-xs font-semibold">Est Rate *</Label><Input type="number" step="any" className="mt-1.5" {...itemForm.register('rate')} /></div>
            </div>
            <div><Label className="text-xs font-semibold">Remarks</Label><Input className="mt-1.5" placeholder="Optional notes" {...itemForm.register('remarks')} /></div>
            <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => setItemDlg(null)}>Cancel</Button><Button type="submit" className="bg-violet-600 text-white rounded-xl" disabled={createItem.isPending}>Add Item</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Actual progress Dialog */}
      <Dialog open={!!actualDlg} onOpenChange={() => setActualDlg(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Update Actual Progress</DialogTitle><DialogDescription>Log actual quantities and expenditure incurred so far.</DialogDescription></DialogHeader>
          {actualErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{actualErr}</AlertDescription></Alert>}
          <form onSubmit={actualForm.handleSubmit(v => { setActualErr(null); updateActual.mutate(v); })} className="space-y-4 pt-2">
            <div><Label className="text-xs font-semibold">Actual Quantity Incurred ({actualDlg?.unit})</Label><Input type="number" step="any" className="mt-1.5" {...actualForm.register('actualQty')} /></div>
            <div><Label className="text-xs font-semibold">Actual Amount Incurred (LKR)</Label><Input type="number" step="any" className="mt-1.5" {...actualForm.register('actualAmount')} /></div>
            <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => setActualDlg(null)}>Cancel</Button><Button type="submit" className="bg-emerald-600 text-white rounded-xl" disabled={updateActual.isPending}>Update Progress</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
