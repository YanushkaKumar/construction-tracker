'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, Plus, Loader2, AlertCircle, Truck, Store, Layers,
  AlertTriangle, SlidersHorizontal, FolderDot, Star
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Material {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  category?: string;
  minimumStock: number;
  currentStock: number;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  materialTypes: string[];
  rating?: number;
  isActive: boolean;
}

interface MaterialRequest {
  id: string;
  projectId: string;
  materialId: string;
  supplierId?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status: 'PENDING' | 'APPROVED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  material: { name: string; unit: string };
  project?: { name: string; code: string };
  supplier?: { name: string };
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const requestSchema = z.object({
  materialId: z.string().min(1, 'Material selection is required'),
  supplierId: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than zero'),
  notes: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const statusMeta: Record<string, { label: string; bgClass: string; textClass: string }> = {
  PENDING: { label: 'Pending', bgClass: 'bg-warning-subtle/10 border-warning/25', textClass: 'text-warning' },
  APPROVED: { label: 'Approved', bgClass: 'bg-info-subtle/10 border-info/25', textClass: 'text-info' },
  ORDERED: { label: 'Ordered', bgClass: 'bg-info-subtle/10 border-info/25', textClass: 'text-info' },
  DELIVERED: { label: 'Delivered', bgClass: 'bg-success-subtle/10 border-success/25', textClass: 'text-success' },
  CANCELLED: { label: 'Cancelled', bgClass: 'bg-danger-subtle/10 border-danger/25', textClass: 'text-danger' },
};

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory' | 'suppliers'>('requests');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  // Fetch materials list
  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => (await apiClient.get('/materials')).data,
    retry: 1,
  });

  // Fetch suppliers list
  const { data: suppliersData, isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => (await apiClient.get('/suppliers')).data,
    retry: 1,
  });

  // Fetch projects list for filter
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  // Fetch material requests for project
  const { data: requestsData, isLoading: isRequestsLoading } = useQuery<MaterialRequest[]>({
    queryKey: ['material-requests', selectedProjectId, projectsData?.data],
    queryFn: async () => {
      const pList = projectsData?.data || [];
      if (selectedProjectId && selectedProjectId !== 'ALL') {
        return (await apiClient.get(`/projects/${selectedProjectId}/material-requests`)).data;
      }
      const allReqs: MaterialRequest[] = [];
      for (const p of pList) {
        try {
          const res = await apiClient.get(`/projects/${p.id}/material-requests`);
          const mapped = (res.data || []).map((r: any) => ({ ...r, project: { id: p.id, name: p.name, code: p.code } }));
          allReqs.push(...mapped);
        } catch { /* skip */ }
      }
      return allReqs;
    },
    retry: 1,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (values: RequestFormValues) => {
      return (await apiClient.post(`/projects/${selectedProjectId}/material-requests`, values)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to submit request');
    }
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      return (await apiClient.patch(`/material-requests/${requestId}/status`, { status })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
    },
  });

  const handleStatusChange = (requestId: string, status: string) => {
    updateRequestStatusMutation.mutate({ requestId, status });
  };

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      materialId: '',
      supplierId: '',
      quantity: 0,
      notes: '',
    },
  });

  const materials = materialsData || [];
  const suppliers = suppliersData || [];
  const requests = requestsData || [];
  const projectsList = projectsData?.data || [];

  const handleCreateRequest = (values: any) => {
    if (selectedProjectId === 'ALL') {
      setMutateError('Please select a specific project first to submit the procurement request.');
      return;
    }
    setMutateError(null);
    createRequestMutation.mutate(values);
  };

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";
  const textareaStyle = "flex min-h-[60px] w-full rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 resize-none placeholder:text-muted-foreground/50 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">Materials & Procurement</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Monitor site inventories, map external suppliers, and track requisition status.</p>
        </div>

        {activeTab === 'requests' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-semibold h-10 rounded-xl transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Request Materials
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                <DialogTitle className="text-sm font-bold text-foreground">Submit Procurement Requisition</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium">Request construction supplies or raw materials for the target workspace.</DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-wider">Requisition Error</AlertTitle>
                  <AlertDescription className="text-xs font-semibold">{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleCreateRequest)} className="space-y-4 font-semibold text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="materialId" className="text-xs font-semibold text-foreground/80">Material Item *</Label>
                  <select 
                    id="materialId" 
                    className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
                    {...register('materialId')}
                  >
                    <option value="">Select Material...</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                  {errors.materialId && <p className="text-[10px] text-danger font-bold">{errors.materialId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supplierId" className="text-xs font-semibold text-foreground/80">Preferred Supplier</Label>
                  <select 
                    id="supplierId" 
                    className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
                    {...register('supplierId')}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className="text-xs font-semibold text-foreground/80">Quantity *</Label>
                  <Input id="quantity" type="number" step="any" placeholder="e.g. 50" {...register('quantity')} className={inputStyle} />
                  {errors.quantity && <p className="text-[10px] text-danger font-bold">{errors.quantity.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold text-foreground/80">Delivery Notes / Remarks</Label>
                  <textarea 
                    id="notes" 
                    placeholder="Deliver to site storage bay. Cast deadline priority."
                    {...register('notes')}
                    className={textareaStyle}
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                  <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Requesting…</>
                    ) : (
                      'Submit Requisition'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/25 p-1 rounded-xl border border-border/25 overflow-x-auto gap-1 w-max select-none">
        {[
          { id: 'requests', label: 'Procurement Requests', icon: Truck },
          { id: 'inventory', label: 'Inventory Stock', icon: Layers },
          { id: 'suppliers', label: 'Suppliers Directory', icon: Store }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/20 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-1 text-left">
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex items-center gap-3 p-3.5 bg-accent/15 border border-border/20 rounded-xl select-none text-left">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap font-mono">Filter Workspace</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={selectStyle + ' max-w-xs h-9'}
              >
                <option value="ALL">All Company Requisitions</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {isRequestsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none glass-panel border-border/30 rounded-2xl">
                <Truck className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">No Procurement Requests</p>
                <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">No material requisitions have been submitted yet.</p>
              </div>
            ) : (
              <Card className="glass-panel border-border/30 shadow-panel">
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[15px] text-left border-collapse font-semibold">
                      <thead>
                        <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[11px] font-mono select-none">
                          <th className="pb-2.5 pl-2">Material Item</th>
                          <th className="pb-2.5">Project Code</th>
                          <th className="pb-2.5">Quantity</th>
                          <th className="pb-2.5 text-right">Cost Estimate</th>
                          <th className="pb-2.5">Supplier</th>
                          <th className="pb-2.5 pr-2 text-center">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((req, i) => {
                          const stat = statusMeta[req.status] || { label: req.status, bgClass: 'bg-accent/40', textClass: 'text-muted-foreground/80' };
                          return (
                            <tr key={i} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                              <td className="py-3 pl-2 font-bold text-foreground">{req.material.name}</td>
                              <td className="py-3 text-muted-foreground/80 font-bold uppercase font-mono">{req.project?.code || 'PRJ-001'}</td>
                              <td className="py-3 text-foreground font-bold">{req.quantity} {req.material.unit}</td>
                              <td className="py-3 text-right font-semibold text-foreground font-mono text-financial">LKR {(req.totalPrice || 0).toLocaleString()}</td>
                              <td className="py-3 text-muted-foreground/80">{req.supplier?.name || '—'}</td>
                              <td className="py-3 pr-2 text-center select-none">
                                <select 
                                  value={req.status}
                                  onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-border/20 outline-none ${stat.bgClass} ${stat.textClass} font-mono`}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="APPROVED">Approved</option>
                                  <option value="ORDERED">Ordered</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {isMaterialsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none glass-panel border-border/30 rounded-2xl">
                <Package className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">No Materials Found</p>
                <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">Your inventory is currently empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((m) => {
                  const isLow = m.currentStock <= m.minimumStock;
                  return (
                    <Card key={m.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-panel border-border/25 bg-card/65 backdrop-blur-xl ${isLow ? 'ring-1 ring-danger/25 bg-danger-subtle/5' : ''}`}>
                      {isLow && <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-danger" />}
                      <CardContent className="p-4 pl-5 space-y-4 font-semibold text-left">
                        <div className="flex items-center justify-between select-none">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-mono">{m.category || 'Inventory'}</span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger bg-danger-subtle/10 border border-danger/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-[18px] lg:text-[20px] font-bold text-foreground leading-snug">{m.name}</h4>
                        </div>

                        <div className="flex justify-between items-baseline border-b border-border/15 pb-2">
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider font-mono">Current Stock</span>
                          <span className="text-[20px] font-semibold text-foreground font-mono text-financial">
                            {m.currentStock} <span className="text-[11px] text-muted-foreground font-bold uppercase">{m.unit}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[13px] font-semibold text-muted-foreground/75 font-mono select-none">
                          <div>
                            <span className="text-muted-foreground/45 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Min Limit</span>
                            <span className="text-foreground/90 font-bold">{m.minimumStock} {m.unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground/45 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Unit Cost</span>
                            <span className="text-foreground/90 font-bold text-financial">LKR {m.unitPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            {isSuppliersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none glass-panel border-border/30 rounded-2xl">
                <Store className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">No Suppliers Found</p>
                <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">You haven't added any suppliers to your directory yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((s) => (
                  <Card key={s.id} className="relative overflow-hidden hover:shadow-panel transition-all duration-200 border-border/25 bg-card/65 backdrop-blur-xl">
                    <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-success" />
                    <CardContent className="p-4 pl-5 space-y-3.5 font-semibold text-left">
                      <div className="flex items-center justify-between select-none">
                        <span className="text-[13px] text-success font-semibold text-financial flex items-center gap-1 font-mono">
                          <Star className="w-3.5 h-3.5 text-success fill-success" /> {s.rating || 5}.0 rating
                        </span>
                        <span className="text-[10px] font-bold bg-success-subtle text-success px-2 py-0.5 rounded-full border border-success/20 uppercase tracking-wider font-mono">Active supplier</span>
                      </div>
                      
                      <h4 className="text-[18px] lg:text-[20px] font-bold text-foreground">{s.name}</h4>
                      
                      <div className="space-y-1 text-[15px] text-muted-foreground/80 border-t border-border/15 pt-3 leading-relaxed">
                        <div>
                          <strong className="text-foreground/75 font-semibold">Contact:</strong> {s.contactPerson || '—'}
                        </div>
                        <div>
                          <strong className="text-foreground/75 font-semibold">Phone:</strong> {s.phone || '—'}
                        </div>
                        {s.email && (
                          <div>
                            <strong className="text-foreground/75 font-semibold">Email:</strong> {s.email}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 flex flex-wrap gap-1 border-t border-border/15 select-none font-mono">
                        {s.materialTypes.map((cat, idx) => (
                          <span key={idx} className="bg-accent/40 border border-border/25 text-muted-foreground/80 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
