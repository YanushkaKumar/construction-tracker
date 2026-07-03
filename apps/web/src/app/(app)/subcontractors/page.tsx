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
  DRAFT: { label: 'Draft', bgClass: 'bg-accent/40 border-border/20', textClass: 'text-muted-foreground', dotClass: 'bg-muted-foreground/30' },
  ACTIVE: { label: 'Active', bgClass: 'bg-success-subtle/10 border-success/25', textClass: 'text-success', dotClass: 'status-active' },
  COMPLETED: { label: 'Done', bgClass: 'bg-info-subtle/10 border-info/25', textClass: 'text-info', dotClass: 'status-complete' },
  DISPUTED: { label: 'Dispute', bgClass: 'bg-danger-subtle/10 border-danger/25', textClass: 'text-danger', dotClass: 'status-critical' },
  TERMINATED: { label: 'Terminated', bgClass: 'bg-accent/40 border-border/20', textClass: 'text-muted-foreground/50', dotClass: 'bg-muted-foreground/20' },
};

const specIcons: Record<string, string> = {
  'MEP': '⚡', 'Tiling': '🔲', 'Painting': '🎨', 'Plumbing': '🔧',
  'Electrical': '💡', 'Piling': '🏗️', 'Waterproofing': '💧', 'Landscaping': '🌿',
};

export default function SubcontractorsPage() {
  const queryClient = useQueryClient();
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

  const invalidateAll = () => { queryClient.invalidateQueries({ queryKey: ['subcontractors'] }); queryClient.invalidateQueries({ queryKey: ['subcontractor-contracts'] }); };

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

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">Subcontractors Registry</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Catalog external vendor crews, register scope of work contracts, and monitor disbursements.</p>
        </div>

        {tab === 'registry' ? (
          <Dialog open={subDlg} onOpenChange={setSubDlg}>
            <DialogTrigger asChild>
              <Button className="font-semibold h-10 rounded-xl transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Register Subcontractor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
              <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                <DialogTitle className="text-sm font-bold text-foreground">Register Subcontractor profile</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Add subcontractor company profiles to the system database.</DialogDescription>
              </DialogHeader>
              {subErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertDescription className="text-xs">{subErr}</AlertDescription></Alert>}
              <form onSubmit={subForm.handleSubmit(v => { setSubErr(null); createSub.mutate(v); })} className="space-y-4 font-semibold text-left">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Company Name *</Label>
                  <Input placeholder="Colombo MEP Engineers" {...subForm.register('name')} className={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Specialization *</Label>
                  <select className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold" {...subForm.register('specialization')}>
                    {['MEP', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Waterproofing', 'Piling', 'Landscaping', 'Steelwork', 'HVAC', 'Glazing', 'Roofing', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Contact Person</Label>
                    <Input {...subForm.register('contactPerson')} className={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Phone</Label>
                    <Input {...subForm.register('phone')} className={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Email</Label>
                  <Input {...subForm.register('email')} className={inputStyle} />
                </div>
                <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                  <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold" onClick={() => setSubDlg(false)}>Cancel</Button>
                  <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={createSub.isPending}>
                    {createSub.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Register'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={conDlg} onOpenChange={setConDlg}>
            <DialogTrigger asChild>
              <Button className="font-semibold h-10 rounded-xl transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
              <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                <DialogTitle className="text-sm font-bold text-foreground">Create Scope Contract</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Assign subcontractors to active project workspaces.</DialogDescription>
              </DialogHeader>
              {conErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertDescription className="text-xs">{conErr}</AlertDescription></Alert>}
              <form onSubmit={conForm.handleSubmit(v => { setConErr(null); createCon.mutate(v); })} className="space-y-4 font-semibold text-left">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Subcontractor *</Label>
                    <select className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold" {...conForm.register('subcontractorId')}>
                      <option value="">Select...</option>
                      {(subs || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Project *</Label>
                    <select className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold" {...conForm.register('projectId')}>
                      <option value="">Select...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Work Scope *</Label>
                  <Input placeholder="Plumbing installation for floor 1-4" {...conForm.register('workScope')} className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Contract amount (LKR) *</Label>
                    <Input type="number" {...conForm.register('contractAmount')} className={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Retention %</Label>
                    <Input type="number" step="0.5" {...conForm.register('retentionPercent')} className={inputStyle} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Start Date</Label>
                    <Input type="date" {...conForm.register('startDate')} className={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">End Date</Label>
                    <Input type="date" {...conForm.register('endDate')} className={inputStyle} />
                  </div>
                </div>
                <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                  <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold" onClick={() => setConDlg(false)}>Cancel</Button>
                  <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={createCon.isPending}>
                    {createCon.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Create Contract'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Segmented switcher */}
      <div className="flex bg-accent/25 p-1 rounded-xl border border-border/25 overflow-x-auto gap-1 w-max select-none">
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/20 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-1 text-left font-semibold">
        {tab === 'registry' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {subsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold">
                {(subs || []).map((sub) => (
                  <Card key={sub.id} className="relative overflow-hidden hover:shadow-panel transition-all duration-200 group border-border/25 bg-card/65 backdrop-blur-xl">
                    <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-foreground/50" />
                    <CardContent className="p-4 pl-5 space-y-4">
                      <div className="flex justify-between items-start select-none">
                        <div>
                          <h4 className="text-[18px] lg:text-[20px] font-bold text-foreground group-hover:text-foreground/80 transition-colors">{sub.name}</h4>
                          <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider font-mono">{specIcons[sub.specialization] || '🏗️'} {sub.specialization}</span>
                        </div>
                        <button className="text-muted-foreground/60 hover:text-danger p-1 transition-colors rounded hover:bg-danger/10" onClick={() => delSub.mutate(sub.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-[15px] text-muted-foreground/80 border-t border-border/15 pt-3 leading-relaxed">
                        {sub.contactPerson && <div className="flex items-center gap-2"><HardHat className="w-3.5 h-3.5 text-muted-foreground/45" />{sub.contactPerson}</div>}
                        {sub.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground/45" />{sub.phone}</div>}
                        {sub.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground/45" />{sub.email}</div>}
                      </div>

                      <div className="border-t border-border/15 pt-2 text-[10px] font-bold text-muted-foreground/45 uppercase tracking-wider select-none font-mono">
                        {sub._count?.contracts || 0} Active contracts
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!subs || subs.length === 0) && (
                  <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center select-none glass-panel border-border/30 rounded-2xl">
                    <HardHat className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
                    <p className="text-sm font-bold text-foreground mb-1">No subcontractors registered</p>
                    <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">Add a subcontractor company profile to start building your directory.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'contracts' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {payDlg && (
              <Dialog open={!!payDlg} onOpenChange={() => setPayDlg(null)}>
                <DialogContent className="sm:max-w-sm bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
                  <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                    <DialogTitle className="text-sm font-bold">Record Subcontractor payment</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Record cash outflow payments disbursed against this contract.</DialogDescription>
                  </DialogHeader>
                  {payErr && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertDescription className="text-xs">{payErr}</AlertDescription></Alert>}
                  <form onSubmit={payForm.handleSubmit(v => { setPayErr(null); createPay.mutate(v); })} className="space-y-3.5 pt-1 font-semibold text-left">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Amount (LKR) *</Label>
                      <Input type="number" {...payForm.register('amount')} className={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Payment Date *</Label>
                      <Input type="date" {...payForm.register('payDate')} className={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Reference / Check No.</Label>
                      <Input placeholder="CHQ-001" {...payForm.register('reference')} className={inputStyle} />
                    </div>
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                      <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-semibold" onClick={() => setPayDlg(null)}>Cancel</Button>
                      <Button type="submit" className="rounded-xl h-9 text-xs font-semibold shadow-sm" disabled={createPay.isPending}>
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
                  <div key={i} className="h-16 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3.5">
                {(contracts || []).map((con) => {
                  const paid = Number(con.paidAmount);
                  const total = Number(con.contractAmount);
                  const pct = total > 0 ? (paid / total) * 100 : 0;
                  const remaining = total - paid;
                  const isExpanded = expanded === con.id;
                  const meta = statusMeta[con.status] || { label: con.status, dotClass: '' };

                  return (
                    <Card key={con.id} className="overflow-hidden hover:shadow-panel transition-all duration-200 border-border/25 bg-card/65 backdrop-blur-xl">
                      <button 
                        onClick={() => setExpanded(isExpanded ? null : con.id)} 
                        className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`status-dot ${meta.dotClass} w-2 h-2 rounded-full`} />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none font-mono">
                              <span className="text-foreground/80 font-sans">{con.subcontractor?.name}</span>
                              <span>•</span>
                              <span>{con.project?.code}</span>
                            </div>
                            <h4 className="text-[18px] lg:text-[20px] font-bold text-foreground truncate">{con.workScope}</h4>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 text-right select-none font-semibold">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block font-mono">Contract Val</span>
                            <span className="font-bold text-foreground text-[15px] text-financial font-mono">{fmt(total)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block font-mono">Paid Out</span>
                            <span className="font-bold text-success text-[15px] text-financial font-mono">{fmt(paid)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block font-mono">Outstanding</span>
                            <span className="font-bold text-warning text-[15px] text-financial font-mono">{fmt(remaining)}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground/45 transition-transform hidden sm:block ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-border/15 space-y-4">
                          <ProgressBar value={pct} label="Payment Progress" showLabel height={4} />
                          <div className="flex gap-2 justify-end select-none">
                            <Button size="xs" className="font-semibold h-8 px-3.5 rounded-lg text-xs" onClick={(e) => { e.stopPropagation(); setPayDlg(con.id); }}>
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
                  <div className="py-16 text-center text-muted-foreground flex flex-col items-center select-none glass-panel border-border/30 rounded-2xl">
                    <FileText className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
                    <p className="text-sm font-bold text-foreground mb-1">No contracts draft logged</p>
                    <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">Draft your first contract scope to track payment disbursements.</p>
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
