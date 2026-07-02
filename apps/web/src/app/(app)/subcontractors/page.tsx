'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  HardHat, Plus, Loader2, AlertCircle, Trash2, Phone, Mail,
  ChevronRight, FileText, Banknote, Building2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProgressBar } from '@/components/ui/custom-charts';

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

const statusMeta: Record<string, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  DRAFT: { label: 'Draft', bgClass: 'bg-accent', textClass: 'text-muted-foreground', dotClass: 'bg-muted-foreground/30' },
  ACTIVE: { label: 'Active', bgClass: 'bg-success-subtle', textClass: 'text-success', dotClass: 'status-active' },
  COMPLETED: { label: 'Done', bgClass: 'bg-info-subtle', textClass: 'text-info', dotClass: 'status-complete' },
  DISPUTED: { label: 'Dispute', bgClass: 'bg-danger-subtle', textClass: 'text-danger', dotClass: 'status-critical' },
  TERMINATED: { label: 'Terminated', bgClass: 'bg-accent', textClass: 'text-muted-foreground/50', dotClass: 'bg-muted-foreground/20' },
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

  const selectStyle = "h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Subcontractors</h1>
          <p className="text-caption mt-1">Catalog external crews, register contract scopes, and track project payments.</p>
        </div>

        {tab === 'registry' ? (
          <Dialog open={subDlg} onOpenChange={setSubDlg}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Register Subcontractor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Register Subcontractor</DialogTitle>
                <DialogDescription>Add a subcontractor profile to your system database.</DialogDescription>
              </DialogHeader>
              {subErr && <Alert variant="destructive"><AlertDescription>{subErr}</AlertDescription></Alert>}
              <form onSubmit={subForm.handleSubmit(v => { setSubErr(null); createSub.mutate(v); })} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-caption">Company Name *</Label>
                  <Input placeholder="Colombo MEP Engineers" {...subForm.register('name')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption">Specialization *</Label>
                  <select className={selectStyle + ' w-full h-9 font-medium'} {...subForm.register('specialization')}>
                    {['MEP', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Waterproofing', 'Piling', 'Landscaping', 'Steelwork', 'HVAC', 'Glazing', 'Roofing', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-caption">Contact Person</Label>
                    <Input {...subForm.register('contactPerson')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-caption">Phone</Label>
                    <Input {...subForm.register('phone')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption">Email</Label>
                  <Input {...subForm.register('email')} />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setSubDlg(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSub.isPending}>
                    {createSub.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Register'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={conDlg} onOpenChange={setConDlg}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Contract</DialogTitle>
                <DialogDescription>Assign subcontractors to projects with defined scopes and budgets.</DialogDescription>
              </DialogHeader>
              {conErr && <Alert variant="destructive"><AlertDescription>{conErr}</AlertDescription></Alert>}
              <form onSubmit={conForm.handleSubmit(v => { setConErr(null); createCon.mutate(v); })} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-caption">Subcontractor *</Label>
                    <select className={selectStyle + ' w-full h-9 font-medium'} {...conForm.register('subcontractorId')}>
                      <option value="">Select...</option>
                      {(subs || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-caption">Project *</Label>
                    <select className={selectStyle + ' w-full h-9 font-medium'} {...conForm.register('projectId')}>
                      <option value="">Select...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption">Work Scope *</Label>
                  <Input placeholder="Plumbing installation for floor 1-4" {...conForm.register('workScope')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-caption">Contract amount (LKR) *</Label>
                    <Input type="number" {...conForm.register('contractAmount')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-caption">Retention %</Label>
                    <Input type="number" step="0.5" {...conForm.register('retentionPercent')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-caption">Start Date</Label>
                    <Input type="date" {...conForm.register('startDate')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-caption">End Date</Label>
                    <Input type="date" {...conForm.register('endDate')} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setConDlg(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCon.isPending}>
                    {createCon.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Create Contract'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Segmented switcher */}
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
        {[
          { id: 'registry', label: 'Subcontractor Registry', icon: HardHat },
          { id: 'contracts', label: 'Contracts & Payments', icon: FileText }
        ].map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/40 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {tab === 'registry' && (
          <div className="space-y-4">
            {subsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(subs || []).map((sub) => (
                  <Card key={sub.id} className="relative overflow-hidden hover:shadow-panel transition-all duration-250 group">
                    <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-foreground/60" />
                    <CardContent className="p-5 pl-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground group-hover:text-foreground/80 transition-colors">{sub.name}</h4>
                          <span className="text-[10px] font-semibold text-muted-foreground/60">{specIcons[sub.specialization] || '🏗️'} {sub.specialization}</span>
                        </div>
                        <button className="text-muted-foreground hover:text-danger p-1 transition-colors" onClick={() => delSub.mutate(sub.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground/80 border-t border-border/10 pt-3">
                        {sub.contactPerson && <div className="flex items-center gap-2"><HardHat className="w-3.5 h-3.5 text-muted-foreground/40" />{sub.contactPerson}</div>}
                        {sub.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground/40" />{sub.phone}</div>}
                        {sub.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground/40" />{sub.email}</div>}
                      </div>

                      <div className="border-t border-border/10 pt-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                        {sub._count?.contracts || 0} active contracts
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!subs || subs.length === 0) && (
                  <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center">
                    <HardHat className="w-8 h-8 text-muted-foreground/20 mb-3" />
                    <p className="text-title text-foreground mb-1">No subcontractors registered</p>
                    <p className="text-caption">Register a subcontractor profile to start building your directory.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'contracts' && (
          <div className="space-y-4">
            {payDlg && (
              <Dialog open={!!payDlg} onOpenChange={() => setPayDlg(null)}>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>Record cash outflow payment against this contract.</DialogDescription>
                  </DialogHeader>
                  {payErr && <Alert variant="destructive"><AlertDescription>{payErr}</AlertDescription></Alert>}
                  <form onSubmit={payForm.handleSubmit(v => { setPayErr(null); createPay.mutate(v); })} className="space-y-3">
                    <div>
                      <Label className="text-caption">Amount (LKR) *</Label>
                      <Input type="number" {...payForm.register('amount')} />
                    </div>
                    <div>
                      <Label className="text-caption">Date *</Label>
                      <Input type="date" {...payForm.register('payDate')} />
                    </div>
                    <div>
                      <Label className="text-caption">Reference No.</Label>
                      <Input placeholder="CHQ-001" {...payForm.register('reference')} />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                      <Button type="button" variant="outline" onClick={() => setPayDlg(null)}>Cancel</Button>
                      <Button type="submit" disabled={createPay.isPending}>
                        {createPay.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Record Payment'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {conLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(contracts || []).map((con) => {
                  const paid = Number(con.paidAmount);
                  const total = Number(con.contractAmount);
                  const pct = total > 0 ? (paid / total) * 100 : 0;
                  const remaining = total - paid;
                  const isExpanded = expanded === con.id;
                  const meta = statusMeta[con.status] || { label: con.status, dotClass: '' };

                  return (
                    <Card key={con.id} className="overflow-hidden hover:shadow-panel transition-all duration-200">
                      <button 
                        onClick={() => setExpanded(isExpanded ? null : con.id)} 
                        className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`status-dot ${meta.dotClass} w-2 h-2 rounded-full`} />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                              <span className="text-foreground/80">{con.subcontractor?.name}</span>
                              <span>•</span>
                              <span>{con.project?.code}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-foreground truncate">{con.workScope}</h4>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                          <div className="text-left sm:text-right">
                            <span className="text-label text-muted-foreground/50 text-[9px] block">Contract Amount</span>
                            <span className="font-semibold text-foreground text-xs text-financial">{fmt(total)}</span>
                          </div>
                          <div>
                            <span className="text-label text-muted-foreground/50 text-[9px] block">Paid Out</span>
                            <span className="font-semibold text-success text-xs text-financial">{fmt(paid)}</span>
                          </div>
                          <div>
                            <span className="text-label text-muted-foreground/50 text-[9px] block">Outstanding</span>
                            <span className="font-semibold text-warning text-xs text-financial">{fmt(remaining)}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground/40 transition-transform hidden sm:block ${isExpanded ? 'rotate-95' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-border/20 space-y-4 animate-slide-up">
                          <ProgressBar value={pct} label="Payment Progress" showLabel height={4} />
                          <div className="flex gap-2 justify-end">
                            <Button size="xs" onClick={(e) => { e.stopPropagation(); setPayDlg(con.id); }}>
                              <Banknote className="w-3.5 h-3.5 mr-1" />
                              Record Payment
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {(!contracts || contracts.length === 0) && (
                  <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                    <FileText className="w-8 h-8 text-muted-foreground/20 mb-3" />
                    <p className="text-title text-foreground mb-1">No contracts yet</p>
                    <p className="text-caption">Draft your first contract scope to track payment advances.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
