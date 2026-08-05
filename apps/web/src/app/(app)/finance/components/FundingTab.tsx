'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, CheckCircle2, AlertTriangle, AlertCircle, Loader2, Download, Coins, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ProgressBar, DonutChart } from '@/components/ui/custom-charts';
import { SkeletonStatGrid, SkeletonChart } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  SOURCE_CATEGORIES, FIELD_LABELS, NUMERIC_FIELDS, DATE_FIELDS, 
  inputCls, UpcomingRepaymentsCard 
} from './FundingConstants';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

export function FundingDashboardTab() {
  const qc = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<'select' | 'form' | 'review'>('select');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('capital');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['funding-dashboard'],
    queryFn: async () => (await apiClient.get('/funding-sources/dashboard')).data,
    retry: 1,
  });

  const createFund = useMutation({
    mutationFn: async (values: any) => {
      return (await apiClient.post('/funding-sources', values)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funding-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      closeWizard();
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to create funding source');
    }
  });

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardStep('select');
    setSelectedType(null);
    setFormValues({});
    setMutateError(null);
  };

  const handleTypeSelect = (type: string, redirect?: string) => {
    if (redirect) {
      // Redirect to existing tab for Bank Loans / Advances
      closeWizard();
      // Find parent and switch tab
      const tabButtons = document.querySelectorAll('[role="tab"]');
      tabButtons.forEach(btn => {
        if (redirect === 'loans' && btn.textContent?.includes('Bank Loans')) (btn as HTMLElement).click();
        if (redirect === 'advances') {
          // No dedicated advances tab; it lives in project pages. Just inform the user.
          alert('Customer Advances are managed from individual Project pages → Advances tab.');
        }
      });
      return;
    }
    setSelectedType(type);
    setFormValues({ date: new Date().toISOString().split('T')[0] });
    setWizardStep('form');
  };

  const handleFormSubmit = () => {
    setWizardStep('review');
  };

  const handleConfirmSubmit = () => {
    if (!selectedType) return;

    // Find the type config
    let typeConfig: any = null;
    let catKey = '';
    for (const [key, cat] of Object.entries(SOURCE_CATEGORIES)) {
      const found = cat.types.find(t => t.type === selectedType);
      if (found) { typeConfig = found; catKey = key; break; }
    }
    if (!typeConfig) return;

    const amount = Number(formValues.amount || 0);
    const metadataFields: Record<string, any> = {};
    const nonMetaFields = ['amount', 'date', 'reference', 'approvedBy', 'notes', 'paymentMethod'];
    for (const [key, val] of Object.entries(formValues)) {
      if (!nonMetaFields.includes(key) && val) metadataFields[key] = val;
    }

    createFund.mutate({
      type: selectedType,
      name: typeConfig.label + (formValues.ownerName ? ` — ${formValues.ownerName}` : formValues.directorName ? ` — ${formValues.directorName}` : formValues.lenderName ? ` — ${formValues.lenderName}` : formValues.investorName ? ` — ${formValues.investorName}` : ''),
      amount,
      sourceCategory: catKey,
      description: formValues.notes || null,
      referenceNo: formValues.reference || null,
      receivedDate: formValues.date || null,
      paymentMethod: formValues.paymentMethod || null,
      approvedBy: formValues.approvedBy || null,
      metadata: metadataFields,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonStatGrid count={4} cols={4} />
        <SkeletonChart height={280} />
      </div>
    );
  }

  const db = data || { currentCash: 0, availableAdvances: 0, loans: 0, companyFunds: 0, sources: [], sourcesByCategory: {}, timeline: [], insights: [] };
  const selectedWallet = db.sources.find((s: any) => s.id === selectedWalletId) || db.sources[0];

  // Get type config from selected type
  const getSelectedTypeConfig = () => {
    for (const cat of Object.values(SOURCE_CATEGORIES)) {
      const found = cat.types.find(t => t.type === selectedType);
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
      {/* ── CFO KPI Row ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border/25 rounded-2xl shadow-surface text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono">Total Available Cash</span>
          <p className="text-xl font-bold mt-1.5 tabular-nums text-foreground/90">{fmt(db.currentCash)}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">All sources combined</p>
        </div>
        <div className="p-4 bg-card border border-border/25 rounded-2xl shadow-surface text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono">Loan Facilities</span>
          <p className="text-xl font-bold mt-1.5 tabular-nums text-foreground/90">{fmt(db.loans)}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">Bank & facility balances</p>
        </div>
        <div className="p-4 bg-card border border-border/25 rounded-2xl shadow-surface text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono">Client Advances</span>
          <p className="text-xl font-bold mt-1.5 tabular-nums text-foreground/90">{fmt(db.availableAdvances)}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">Project advance pools</p>
        </div>
        <div className="p-4 bg-card border border-border/25 rounded-2xl shadow-surface text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono">Company Equity</span>
          <p className="text-xl font-bold mt-1.5 tabular-nums text-foreground/90">{fmt(db.companyFunds)}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">Capital & investments</p>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Source Registry */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header with Add Funds button */}
          <div className="flex justify-between items-center bg-card/65 backdrop-blur-xl p-4 rounded-2xl border border-border/25 shadow-surface select-none">
            <div className="text-left">
              <h3 className="text-[15px] font-bold text-foreground">Fund Source Registry</h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Enterprise funding sources grouped by category.</p>
            </div>
            <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) closeWizard(); else { setWizardOpen(true); setWizardStep('select'); } }}>
              <DialogTrigger asChild>
                <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold h-9 px-4 rounded-xl text-xs shadow-sm gap-2">
                  <Plus className="w-4 h-4" /> Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent className={cn(
                'rounded-2xl bg-card border border-border/30 shadow-elevated text-left overflow-y-auto',
                wizardStep === 'select' ? 'sm:max-w-2xl max-h-[85vh] p-0' : 'sm:max-w-lg max-h-[90vh]'
              )}>
                {/* ────── STEP 1: Source Selection ────── */}
                {wizardStep === 'select' && (
                  <div className="p-0">
                    <div className="px-6 pt-6 pb-4 border-b border-border/15">
                      <DialogTitle className="text-[16px] font-bold">Add Funds — Choose Source</DialogTitle>
                      <DialogDescription className="text-[12px] text-muted-foreground/65 mt-1">
                        Select the origin of this fund. Each source has its own workflow and required information.
                      </DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                      {Object.entries(SOURCE_CATEGORIES).map(([catKey, cat]) => {
                        const CatIcon = cat.icon;
                        return (
                          <div key={catKey}>
                            <div className="flex items-center gap-2 mb-2.5 select-none">
                              <CatIcon className="w-4 h-4 text-muted-foreground/50" />
                              <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/50">{cat.label}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {cat.types.map(t => (
                                <button
                                  key={t.type}
                                  onClick={() => handleTypeSelect(t.type, t.redirect)}
                                  className="flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-accent/10 hover:bg-accent/30 hover:border-foreground/15 transition-all text-left group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-accent/40 border border-border/20 flex items-center justify-center flex-shrink-0 group-hover:bg-foreground/10 transition-colors">
                                    <Coins className="w-4 h-4 text-muted-foreground/60" />
                                  </div>
                                  <div>
                                    <p className="text-[12px] font-bold text-foreground/90">{t.label}</p>
                                    <p className="text-[10px] text-muted-foreground/55 mt-0.5 leading-tight">{t.description}</p>
                                    {t.redirect && (
                                      <span className="text-[9px] text-primary font-bold mt-1 inline-flex items-center gap-0.5">
                                        Opens dedicated tab <ChevronRight className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ────── STEP 2: Dynamic Form ────── */}
                {wizardStep === 'form' && (() => {
                  const typeConfig = getSelectedTypeConfig();
                  if (!typeConfig) return null;
                  const fields = typeConfig.fields || [];

                  return (
                    <div className="p-5">
                      <DialogHeader className="border-b border-border/15 pb-4 mb-4">
                        <button onClick={() => { setWizardStep('select'); setSelectedType(null); }} className="text-[11px] text-primary font-bold mb-2 hover:underline">← Back to sources</button>
                        <DialogTitle className="text-[15px] font-bold">{typeConfig.label}</DialogTitle>
                        <DialogDescription className="text-[11px] text-muted-foreground/65 mt-0.5">{typeConfig.description}</DialogDescription>
                      </DialogHeader>

                      {mutateError && (
                        <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{mutateError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-3.5">
                        {fields.map(field => (
                          <div key={field} className="space-y-1.5">
                            <Label className="text-[12px] font-semibold text-foreground/80">
                              {FIELD_LABELS[field] || field}
                              {field === 'amount' && <span className="text-danger ml-0.5">*</span>}
                            </Label>
                            {field === 'notes' ? (
                              <textarea
                                value={formValues[field] || ''}
                                onChange={e => setFormValues(v => ({ ...v, [field]: e.target.value }))}
                                className={cn(inputCls, 'h-20 resize-none py-2')}
                                placeholder={`Enter ${(FIELD_LABELS[field] || field).toLowerCase()}…`}
                              />
                            ) : (
                              <Input
                                type={NUMERIC_FIELDS.includes(field) ? 'number' : DATE_FIELDS.includes(field) ? 'date' : 'text'}
                                value={formValues[field] || ''}
                                onChange={e => setFormValues(v => ({ ...v, [field]: e.target.value }))}
                                className={inputCls}
                                placeholder={`Enter ${(FIELD_LABELS[field] || field).toLowerCase()}…`}
                                required={field === 'amount'}
                                min={NUMERIC_FIELDS.includes(field) ? '0' : undefined}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2.5 pt-5 border-t border-border/15 mt-5">
                        <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => { setWizardStep('select'); setSelectedType(null); }}>Back</Button>
                        <Button
                          className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold"
                          onClick={handleFormSubmit}
                          disabled={!formValues.amount || Number(formValues.amount) <= 0}
                        >
                          Review & Confirm →
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* ────── STEP 3: Review & Confirm ────── */}
                {wizardStep === 'review' && (() => {
                  const typeConfig = getSelectedTypeConfig();
                  if (!typeConfig) return null;

                  return (
                    <div className="p-5">
                      <DialogHeader className="border-b border-border/15 pb-4 mb-4">
                        <button onClick={() => setWizardStep('form')} className="text-[11px] text-primary font-bold mb-2 hover:underline">← Edit details</button>
                        <DialogTitle className="text-[15px] font-bold">Confirm Fund Entry</DialogTitle>
                        <DialogDescription className="text-[11px] text-muted-foreground/65 mt-0.5">Review the details below before committing to the treasury.</DialogDescription>
                      </DialogHeader>

                      {mutateError && (
                        <Alert variant="destructive" className="bg-danger-subtle border-danger/30 rounded-xl mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{mutateError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-1 rounded-xl border border-border/25 bg-accent/10 p-4 text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-border/15 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Source Type</span>
                          <span className="text-[12px] font-bold text-foreground">{typeConfig.label}</span>
                        </div>
                        {Object.entries(formValues).filter(([_, v]) => v).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center py-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground/70">{FIELD_LABELS[key] || key}</span>
                            <span className="text-[12px] font-bold text-foreground tabular-nums">
                              {key === 'amount' ? `LKR ${Number(val).toLocaleString()}` : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2.5 pt-5 border-t border-border/15 mt-5">
                        <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setWizardStep('form')}>← Edit</Button>
                        <Button
                          className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 text-xs font-bold gap-1.5"
                          onClick={handleConfirmSubmit}
                          disabled={createFund.isPending}
                        >
                          {createFund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Commit to Treasury
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </div>

          {/* ── Grouped Source Cards ─────────────────── */}
          {Object.entries(SOURCE_CATEGORIES).map(([catKey, catConfig]) => {
            const CatIcon = catConfig.icon;
            const categorySources = (db.sourcesByCategory?.[catKey] || db.sources.filter((s: any) => {
              const cat = s.sourceCategory || 'internal';
              return cat === catKey;
            })) as any[];
            if (categorySources.length === 0) return null;
            const isExpanded = expandedCategory === catKey;

            return (
              <div key={catKey} className="rounded-2xl border border-border/20 bg-card/50 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <CatIcon className="w-4 h-4 text-muted-foreground/50" />
                    <div>
                      <h4 className="text-[12px] font-bold text-foreground/85">{catConfig.label}</h4>
                      <p className="text-[10px] text-muted-foreground/50 font-medium">{categorySources.length} source{categorySources.length !== 1 ? 's' : ''} · Balance: {fmt(categorySources.reduce((a: number, s: any) => a + s.currentBalance, 0))}</p>
                    </div>
                  </div>
                  <ChevronRight className={cn('w-4 h-4 text-muted-foreground/40 transition-transform duration-200', isExpanded && 'rotate-90')} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border/15 pt-3">
                    {categorySources.map((source: any) => {
                      const utilPercent = source.originalAmount > 0
                        ? Math.min(Math.round(((source.originalAmount - source.currentBalance) / source.originalAmount) * 100), 100)
                        : 0;
                      const isSelected = selectedWallet?.id === source.id;

                      return (
                        <Card
                          key={source.id}
                          onClick={() => setSelectedWalletId(source.id)}
                          className={cn(
                            'cursor-pointer border text-left transition-all hover:shadow-md duration-200 rounded-xl',
                            isSelected ? 'border-foreground shadow-surface ring-1 ring-foreground' : 'border-border/25 shadow-surface'
                          )}
                        >
                          <CardContent className="p-3.5 space-y-3">
                            <div className="flex justify-between items-start font-semibold">
                              <div>
                                <h4 className="text-[11px] font-bold text-foreground/90 leading-tight">{source.name}</h4>
                                <span className="text-[9px] font-mono uppercase text-muted-foreground/55">{source.type.replace(/_/g, ' ')}</span>
                              </div>
                              <span className={cn(
                                'chip font-mono text-[9px]',
                                source.originalAmount === 0 && source.currentBalance === 0 ? 'bg-accent/30 border-border/20 text-muted-foreground' :
                                source.currentBalance <= 0 ? 'bg-danger-subtle border-danger/25 text-danger' :
                                utilPercent > 80 ? 'bg-warning-subtle border-warning/25 text-warning' :
                                'bg-success-subtle border-success/25 text-success'
                              )}>
                                {source.originalAmount === 0 && source.currentBalance === 0 ? 'Unfunded' : source.currentBalance <= 0 ? 'Depleted' : 'Active'}
                              </span>
                            </div>

                            <div className="space-y-1 select-none">
                              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground/75 font-mono">
                                <span>Balance: {fmt(source.currentBalance)}</span>
                                <span>{utilPercent}% Used</span>
                              </div>
                              <ProgressBar value={utilPercent} max={100} height={4} />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Wallet Timeline + Insights */}
        <div className="lg:col-span-4 space-y-4">
          {/* Wallet Flow Timeline */}
          <Card className="glass-panel border-border/25 shadow-surface text-left">
            <CardContent className="p-5 space-y-4">
              <div className="border-b border-border/15 pb-3 select-none">
                <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Wallet Flow Timeline</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{selectedWallet?.name || 'No wallet selected'}</p>
              </div>

              {selectedWallet ? (
                <div className="relative pl-5 border-l border-border/25 space-y-5 py-1">
                  {/* Start Node */}
                  <div className="relative text-xs font-semibold">
                    <span className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-success ring-4 ring-card" />
                    <p className="text-success font-bold font-mono">+{fmt(selectedWallet.originalAmount)}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Capital Drawn / Initialized</p>
                  </div>

                  {/* Allocation deductions nodes */}
                  {selectedWallet.allocations && selectedWallet.allocations.map((alloc: any) => (
                    <div key={alloc.id} className="relative text-xs font-semibold">
                      <span className="absolute -left-[25px] w-2 h-2 rounded-full bg-primary ring-4 ring-card" />
                      <p className="text-foreground/90 font-bold font-mono">-{fmt(alloc.amount)}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{alloc.title}</p>
                    </div>
                  ))}

                  {/* End Balance Node */}
                  <div className="relative text-xs font-semibold pt-1 border-t border-border/10">
                    <span className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-foreground ring-4 ring-card" />
                    <p className="text-foreground font-bold font-mono">{fmt(selectedWallet.currentBalance)}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Current Available runway</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-semibold py-8 text-center select-none">Select a wallet to load history flow.</p>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {db.insights && db.insights.length > 0 && (
            <Card className="glass-panel border-border/25 shadow-surface text-left">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Treasury Insights</h4>
                <div className="space-y-2">
                  {db.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground/75 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fund Source Breakdown Donut */}
          {(() => {
            const donutData = Object.entries(SOURCE_CATEGORIES).map(([catKey, catConfig]) => {
              const catSources = (db.sourcesByCategory?.[catKey] || db.sources.filter((s: any) => (s.sourceCategory || 'internal') === catKey)) as any[];
              const balance = catSources.reduce((a: number, s: any) => a + s.currentBalance, 0);
              const colors: Record<string, string> = { capital: '#6366F1', loans: '#F59E0B', client: '#10B981', internal: '#8B5CF6' };
              return { label: catConfig.label, value: balance, color: colors[catKey] || '#64748B' };
            }).filter(d => d.value > 0);

            if (donutData.length === 0) return null;
            return (
              <Card className="glass-panel border-border/25 shadow-surface text-left">
                <CardContent className="p-4">
                  <DonutChart
                    data={donutData}
                    title="Fund Source Mix"
                    subtitle="by category"
                    isCurrency
                  />
                </CardContent>
              </Card>
            );
          })()}

          {/* Upcoming Repayments */}
          <UpcomingRepaymentsCard />
        </div>
      </div>
    </div>
  );
}
