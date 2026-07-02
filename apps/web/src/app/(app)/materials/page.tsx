'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, Plus, Loader2, AlertCircle, Truck, Store, Layers,
  AlertTriangle, SlidersHorizontal, FolderDot
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
  PENDING: { label: 'Pending', bgClass: 'bg-warning-subtle', textClass: 'text-warning' },
  APPROVED: { label: 'Approved', bgClass: 'bg-info-subtle', textClass: 'text-info' },
  ORDERED: { label: 'Ordered', bgClass: 'bg-info-subtle', textClass: 'text-info' },
  DELIVERED: { label: 'Delivered', bgClass: 'bg-success-subtle', textClass: 'text-success' },
  CANCELLED: { label: 'Cancelled', bgClass: 'bg-danger-subtle', textClass: 'text-danger' },
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

  const selectStyle = "h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Materials & Procurement</h1>
          <p className="text-caption mt-1">Monitor inventories, map suppliers, and handle material requests.</p>
        </div>

        {activeTab === 'requests' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Request Materials
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Procurement Request</DialogTitle>
                <DialogDescription>Select material items and quantities to request for the project.</DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleCreateRequest)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="materialId" className="text-caption">Material Item *</Label>
                  <select 
                    id="materialId" 
                    className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-medium"
                    {...register('materialId')}
                  >
                    <option value="">Select Material...</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                  {errors.materialId && <p className="text-[10px] text-destructive font-medium">{errors.materialId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supplierId" className="text-caption">Preferred Supplier</Label>
                  <select 
                    id="supplierId" 
                    className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-medium"
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
                  <Label htmlFor="quantity" className="text-caption">Quantity *</Label>
                  <Input id="quantity" type="number" step="any" placeholder="e.g. 50" {...register('quantity')} />
                  {errors.quantity && <p className="text-[10px] text-destructive font-medium">{errors.quantity.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-caption">Delivery Notes / Remarks</Label>
                  <textarea 
                    id="notes" 
                    placeholder="Deliver to site office. Casting priority."
                    rows={3}
                    className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 resize-none placeholder:text-muted-foreground/60"
                    {...register('notes')}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Requesting…</>
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
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/40 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex items-center gap-3 p-4 bg-accent/20 border border-border/30 rounded-2xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-label text-muted-foreground/60 whitespace-nowrap">Select Project</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="max-w-xs h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold"
              >
                <option value="ALL">All Demo Requisitions</option>
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
                  <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Material Item</th>
                          <th className="pb-3">Project Code</th>
                          <th className="pb-3">Quantity</th>
                          <th className="pb-3 text-right">Cost Estimate</th>
                          <th className="pb-3">Supplier</th>
                          <th className="pb-3 pr-2">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((req, i) => {
                          const stat = statusMeta[req.status] || { label: req.status, bgClass: 'bg-accent', textClass: 'text-muted-foreground' };
                          return (
                            <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                              <td className="py-3.5 pl-2 font-medium text-foreground">{req.material.name}</td>
                              <td className="py-3.5 text-muted-foreground">{req.project?.code || 'PRJ-001'}</td>
                              <td className="py-3.5 text-foreground font-medium">{req.quantity} {req.material.unit}</td>
                              <td className="py-3.5 text-right font-semibold text-foreground text-financial">LKR {(req.totalPrice || 0).toLocaleString()}</td>
                              <td className="py-3.5 text-muted-foreground">{req.supplier?.name || '—'}</td>
                              <td className="py-3.5 pr-2">
                                <select 
                                  value={req.status}
                                  onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border border-border/40 outline-none ${stat.bgClass} ${stat.textClass}`}
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
          <div className="space-y-4">
            {isMaterialsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((m) => {
                  const isLow = m.currentStock <= m.minimumStock;
                  return (
                    <Card key={m.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-panel ${isLow ? 'ring-1 ring-warning/30 bg-warning-subtle/5' : ''}`}>
                      {isLow && <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-warning" />}
                      <CardContent className="p-5 pl-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-label text-muted-foreground/50 text-[9px]">{m.category || 'Inventory'}</span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-warning bg-warning-subtle px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Low Stock
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-foreground">{m.name}</h4>
                        </div>

                        <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                          <span className="text-caption">Current Stock</span>
                          <span className="text-xl font-bold text-foreground text-financial">
                            {m.currentStock} <span className="text-xs text-muted-foreground font-semibold uppercase">{m.unit}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-muted-foreground/60 block uppercase font-bold text-[8px]">Min Limit</span>
                            <span className="font-semibold text-foreground/80">{m.minimumStock} {m.unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground/60 block uppercase font-bold text-[8px]">Est. Cost</span>
                            <span className="font-semibold text-foreground/80 text-financial">LKR {m.unitPrice.toLocaleString()}</span>
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
          <div className="space-y-4">
            {isSuppliersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((s) => (
                  <Card key={s.id} className="relative overflow-hidden hover:shadow-panel transition-all duration-200">
                    <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-success" />
                    <CardContent className="p-5 pl-6 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-info font-bold text-financial">★ {s.rating || 5}.0 Rating</span>
                        <span className="text-[9px] font-bold bg-success-subtle text-success px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                      </div>
                      
                      <h4 className="text-xs font-semibold text-foreground">{s.name}</h4>
                      
                      <div className="space-y-1 text-xs text-muted-foreground/80 border-t border-border/10 pt-3">
                        <div>
                          <strong className="text-foreground/70 font-semibold">Contact:</strong> {s.contactPerson || '—'}
                        </div>
                        <div>
                          <strong className="text-foreground/70 font-semibold">Phone:</strong> {s.phone || '—'}
                        </div>
                        {s.email && (
                          <div>
                            <strong className="text-foreground/70 font-semibold">Email:</strong> {s.email}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 flex flex-wrap gap-1 border-t border-border/10">
                        {s.materialTypes.map((cat, idx) => (
                          <span key={idx} className="bg-accent/40 border border-border/30 text-muted-foreground/80 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
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
