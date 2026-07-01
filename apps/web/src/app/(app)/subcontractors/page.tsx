'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  HardHat, Plus, Loader2, AlertCircle, Trash2, Phone, Mail,
  MapPin, Star, ChevronRight, FileText, Banknote, CircleDollarSign,
  Building2, CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const subSchema = z.object({
  name: z.string().min(2, 'Required'),
  specialization: z.string().min(2, 'Required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

const contractSchema = z.object({
  subcontractorId: z.string().min(1, 'Required'),
  projectId: z.string().min(1, 'Required'),
  workScope: z.string().min(3, 'Required'),
  contractAmount: z.coerce.number().min(1, 'Required'),
  retentionPercent: z.coerce.number().min(0).max(100).default(5),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Required'),
  payDate: z.string().min(1, 'Required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const fmt = (n: number) => `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const statusColor: Record<string, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  DISPUTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  TERMINATED: 'bg-zinc-200 text-zinc-500',
};

const specIcons: Record<string, string> = {
  'MEP': '⚡', 'Tiling': '🔲', 'Painting': '🎨', 'Plumbing': '🔧',
  'Electrical': '💡', 'Piling': '🏗️', 'Waterproofing': '💧', 'Landscaping': '🌿',
};

export default function SubcontractorsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'registry' | 'contracts'>('registry');
  const [subDlg, setSubDlg] = useState(false);
  const [conDlg, setConDlg] = useState(false);
  const [payDlg, setPayDlg] = useState<string | null>(null);
  const [subErr, setSubErr] = useState<string | null>(null);
  const [conErr, setConErr] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: subs, isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ['subcontractors'],
    queryFn: async () => (await apiClient.get('/subcontractors')).data,
  });

  const { data: contracts, isLoading: conLoading } = useQuery<any[]>({
    queryKey: ['subcontractor-contracts'],
    queryFn: async () => (await apiClient.get('/subcontractor-contracts')).data,
    enabled: tab === 'contracts',
  });

  const { data: projData } = useQuery<{ data: any[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });
  const projects = projData?.data || [];

  const subForm = useForm({ resolver: zodResolver(subSchema), defaultValues: { name: '', specialization: 'MEP', contactPerson: '', phone: '', email: '', address: '' } });
  const conForm = useForm({ resolver: zodResolver(contractSchema), defaultValues: { subcontractorId: '', projectId: '', workScope: '', contractAmount: 0, retentionPercent: 5, startDate: '', endDate: '', notes: '' } });
  const payForm = useForm({ resolver: zodResolver(paymentSchema), defaultValues: { amount: 0, payDate: new Date().toISOString().split('T')[0], reference: '', notes: '' } });

  const invalidateAll = () => { qc.invalidateQueries({ queryKey: ['subcontractors'] }); qc.invalidateQueries({ queryKey: ['subcontractor-contracts'] }); };

  const createSub = useMutation({
    mutationFn: async (v: any) => (await apiClient.post('/subcontractors', v)).data,
    onSuccess: () => { invalidateAll(); setSubDlg(false); subForm.reset(); },
    onError: (e: any) => setSubErr(e.response?.data?.message || 'Failed'),
  });

  const createCon = useMutation({
    mutationFn: async (v: any) => (await apiClient.post('/subcontractor-contracts', v)).data,
    onSuccess: () => { invalidateAll(); setConDlg(false); conForm.reset(); },
    onError: (e: any) => setConErr(e.response?.data?.message || 'Failed'),
  });

  const createPay = useMutation({
    mutationFn: async (v: any) => (await apiClient.post(`/subcontractor-contracts/${payDlg}/payments`, v)).data,
    onSuccess: () => { invalidateAll(); setPayDlg(null); payForm.reset(); },
    onError: (e: any) => setPayErr(e.response?.data?.message || 'Failed'),
  });

  const delSub = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/subcontractors/${id}`),
    onSuccess: invalidateAll,
  });

  const inputClass = "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

  const tabs = [
    { id: 'registry', label: 'Subcontractor Registry', icon: HardHat },
    { id: 'contracts', label: 'Contracts & Payments', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <HardHat className="w-5 h-5" />
          </div>
          Subcontractors
        </h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 ml-1">Manage subcontractor registry, contracts, and payment tracking.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-x-auto border border-zinc-200 dark:border-zinc-800 w-max">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button key={id} onClick={() => setTab(id as any)} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}>
              <Icon className={`w-4 h-4 ${isActive ? 'scale-110 transition-transform' : ''}`} />{label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB 1: REGISTRY ═══ */}
      {tab === 'registry' && (
        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-end">
            <Dialog open={subDlg} onOpenChange={setSubDlg}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Add Subcontractor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Register Subcontractor</DialogTitle>
                  <DialogDescription>Add a new subcontractor to your registry.</DialogDescription>
                </DialogHeader>
                {subErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{subErr}</AlertDescription></Alert>}
                <form onSubmit={subForm.handleSubmit(v => { setSubErr(null); createSub.mutate(v); })} className="space-y-4 pt-2">
                  <div><Label className="text-xs font-semibold">Company Name *</Label><Input className="mt-1.5" placeholder="ABC Electricals" {...subForm.register('name')} /></div>
                  <div><Label className="text-xs font-semibold">Specialization *</Label>
                    <select className={inputClass + ' mt-1.5'} {...subForm.register('specialization')}>
                      {['MEP', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Waterproofing', 'Piling', 'Landscaping', 'Steelwork', 'HVAC', 'Glazing', 'Roofing', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs font-semibold">Contact Person</Label><Input className="mt-1.5" {...subForm.register('contactPerson')} /></div>
                    <div><Label className="text-xs font-semibold">Phone</Label><Input className="mt-1.5" {...subForm.register('phone')} /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Email</Label><Input className="mt-1.5" {...subForm.register('email')} /></div>
                  <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => setSubDlg(false)}>Cancel</Button><Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={createSub.isPending}>{createSub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {subsLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(subs || []).map(sub => (
                <Card key={sub.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 hover:shadow-xl transition-all group">
                  <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-500" />
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 transition-colors">{sub.name}</h3>
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{specIcons[sub.specialization] || '🏗️'} {sub.specialization}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600" onClick={() => delSub.mutate(sub.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5 text-xs text-zinc-500">
                      {sub.contactPerson && <div className="flex items-center gap-2"><HardHat className="w-3 h-3" />{sub.contactPerson}</div>}
                      {sub.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{sub.phone}</div>}
                      {sub.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{sub.email}</div>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-zinc-400">{sub._count?.contracts || 0} contracts</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!subs || subs.length === 0) && (
                <div className="col-span-full py-12 text-center text-zinc-500 flex flex-col items-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                  <HardHat className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="font-medium text-sm">No subcontractors registered.</p>
                  <p className="text-xs text-zinc-400 mt-1">Add subcontractors to manage contracts and payments.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: CONTRACTS ═══ */}
      {tab === 'contracts' && (
        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-end">
            <Dialog open={conDlg} onOpenChange={setConDlg}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Create Contract</DialogTitle>
                  <DialogDescription>Assign a subcontractor to a project with a work scope and budget.</DialogDescription>
                </DialogHeader>
                {conErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{conErr}</AlertDescription></Alert>}
                <form onSubmit={conForm.handleSubmit(v => { setConErr(null); createCon.mutate(v); })} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs font-semibold">Subcontractor *</Label>
                      <select className={inputClass + ' mt-1.5'} {...conForm.register('subcontractorId')}>
                        <option value="">Select...</option>
                        {(subs || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs font-semibold">Project *</Label>
                      <select className={inputClass + ' mt-1.5'} {...conForm.register('projectId')}>
                        <option value="">Select...</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs font-semibold">Work Scope *</Label><Input className="mt-1.5" placeholder="Complete MEP installation for floors 1-8" {...conForm.register('workScope')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs font-semibold">Contract Amount (LKR) *</Label><Input type="number" className="mt-1.5" {...conForm.register('contractAmount')} /></div>
                    <div><Label className="text-xs font-semibold">Retention %</Label><Input type="number" step="0.5" className="mt-1.5" {...conForm.register('retentionPercent')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs font-semibold">Start Date</Label><Input type="date" className="mt-1.5" {...conForm.register('startDate')} /></div>
                    <div><Label className="text-xs font-semibold">End Date</Label><Input type="date" className="mt-1.5" {...conForm.register('endDate')} /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => setConDlg(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" disabled={createCon.isPending}>{createCon.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Contract'}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Payment Dialog */}
          <Dialog open={!!payDlg} onOpenChange={() => setPayDlg(null)}>
            <DialogContent className="max-w-sm rounded-2xl">
              <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Record a payment against this contract.</DialogDescription></DialogHeader>
              {payErr && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{payErr}</AlertDescription></Alert>}
              <form onSubmit={payForm.handleSubmit(v => { setPayErr(null); createPay.mutate(v); })} className="space-y-4 pt-2">
                <div><Label className="text-xs font-semibold">Amount (LKR) *</Label><Input type="number" className="mt-1.5" {...payForm.register('amount')} /></div>
                <div><Label className="text-xs font-semibold">Date *</Label><Input type="date" className="mt-1.5" {...payForm.register('payDate')} /></div>
                <div><Label className="text-xs font-semibold">Reference</Label><Input className="mt-1.5" placeholder="CHQ-001" {...payForm.register('reference')} /></div>
                <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => setPayDlg(null)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" disabled={createPay.isPending}>{createPay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Payment'}</Button></div>
              </form>
            </DialogContent>
          </Dialog>

          {conLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : (
            <div className="space-y-4">
              {(contracts || []).map(con => {
                const paid = Number(con.paidAmount);
                const total = Number(con.contractAmount);
                const pct = total > 0 ? (paid / total) * 100 : 0;
                const remaining = total - paid;
                const isExpanded = expanded === con.id;
                return (
                  <Card key={con.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 hover:shadow-lg transition-all">
                    <button onClick={() => setExpanded(isExpanded ? null : con.id)} className="w-full text-left p-5 flex items-center gap-4">
                      <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${con.status === 'ACTIVE' ? 'bg-emerald-500' : con.status === 'COMPLETED' ? 'bg-blue-500' : con.status === 'DISPUTED' ? 'bg-rose-500' : 'bg-zinc-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-violet-600">{con.subcontractor?.name}</span>
                          <span className="text-xs text-zinc-400">•</span>
                          <span className="text-xs font-bold text-amber-600">{con.project?.code}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full uppercase ${statusColor[con.status]}`}>{con.status}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{con.workScope}</h4>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-right">
                        <div><p className="text-xs font-bold text-zinc-400 uppercase">Contract</p><p className="font-bold text-zinc-700 dark:text-zinc-300">{fmt(total)}</p></div>
                        <div><p className="text-xs font-bold text-emerald-500 uppercase">Paid</p><p className="font-bold text-emerald-600">{fmt(paid)}</p></div>
                        <div><p className="text-xs font-bold text-amber-500 uppercase">Due</p><p className="font-bold text-amber-600">{fmt(remaining)}</p></div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4 animate-in slide-in-from-top-1">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium"><span className="text-zinc-500">Payment Progress</span><span className="text-zinc-700 dark:text-zinc-300">{pct.toFixed(1)}%</span></div>
                          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={(e) => { e.stopPropagation(); setPayDlg(con.id); }}>
                            <Banknote className="w-3 h-3 mr-1" /> Record Payment
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {(!contracts || contracts.length === 0) && (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                  <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="font-medium text-sm">No contracts yet.</p>
                  <p className="text-xs text-zinc-400 mt-1">Create a contract to start tracking subcontractor work.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
