'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, 
  Plus, 
  Loader2, 
  AlertCircle,
  Truck,
  Store,
  Layers,
  History,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  SlidersHorizontal,
  FolderDot
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory' | 'suppliers'>('requests');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  // Fetch materials list
  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await apiClient.get('/materials');
      return response.data;
    },
    retry: 1,
  });

  // Fetch suppliers list
  const { data: suppliersData, isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiClient.get('/suppliers');
      return response.data;
    },
    retry: 1,
  });

  // Fetch projects list for filter
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data;
    },
    retry: 1,
  });

  // Fetch material requests for project
  const { data: requestsData, isLoading: isRequestsLoading } = useQuery<MaterialRequest[]>({
    queryKey: ['material-requests', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL' || selectedProjectId === '') return [];
      const response = await apiClient.get(`/projects/${selectedProjectId}/material-requests`);
      return response.data;
    },
    enabled: selectedProjectId !== 'ALL',
    retry: 1,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (values: RequestFormValues) => {
      const response = await apiClient.post(`/projects/${selectedProjectId}/material-requests`, values);
      return response.data;
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
      const response = await apiClient.patch(`/material-requests/${requestId}/status`, { status });
      return response.data;
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

  // Mock fallbacks for preview
  const mockMaterials: Material[] = [
    { id: 'mat1', name: 'Portland Cement (50kg)', unit: 'bags', unitPrice: 1850, category: 'Cement', minimumStock: 50, currentStock: 250 },
    { id: 'mat2', name: 'TMT Steel Bar 12mm', unit: 'tons', unitPrice: 285000, category: 'Steel', minimumStock: 2, currentStock: 1.5 },
    { id: 'mat3', name: 'River Sand', unit: 'cu.m', unitPrice: 22000, category: 'Sand', minimumStock: 10, currentStock: 30 },
  ];

  const mockSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Tokyo Cement Lanka', contactPerson: 'Mr. Senanayake', phone: '+94112223344', email: 'sales@tokyocement.lk', materialTypes: ['Cement'], rating: 5, isActive: true },
    { id: 'sup2', name: 'Lanka Steel Corporation', contactPerson: 'Mr. Gunawardena', phone: '+94112334455', email: 'info@lankasteel.lk', materialTypes: ['Steel'], rating: 4, isActive: true },
  ];

  const mockRequests: MaterialRequest[] = [
    {
      id: 'req1',
      projectId: 'prj1',
      materialId: 'mat1',
      supplierId: 'sup1',
      quantity: 100,
      unitPrice: 1850,
      totalPrice: 185000,
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      material: { name: 'Portland Cement (50kg)', unit: 'bags' },
      project: { name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' },
      supplier: { name: 'Tokyo Cement Lanka' }
    },
    {
      id: 'req2',
      projectId: 'prj1',
      materialId: 'mat2',
      quantity: 5,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      material: { name: 'TMT Steel Bar 12mm', unit: 'tons' },
      project: { name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' }
    }
  ];

  const materials = materialsData || mockMaterials;
  const suppliers = suppliersData || mockSuppliers;
  const requests = (selectedProjectId === 'ALL' || selectedProjectId === '') ? mockRequests : (requestsData || mockRequests);
  const projectsList = projectsData?.data || [
    { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' },
    { id: 'prj2', name: 'Palm Villa - Negombo', code: 'PRJ-002' }
  ];

  const handleCreateRequest = (values: any) => {
    if (selectedProjectId === 'ALL') {
      setMutateError('Please select a specific project first to submit the procurement request.');
      return;
    }
    setMutateError(null);
    createRequestMutation.mutate(values);
  };

  const getRequestBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'ORDERED': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Materials & Procurement
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Log material inventory stock catalogs and submit purchasing requisitions.
          </p>
        </div>

        {/* Create Dialog Trigger (Only active on Requisitions Tab) */}
        {activeTab === 'requests' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/10" />}>
              <Plus className="w-4 h-4 mr-2" />
              Request Materials
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Procurement Request</DialogTitle>
                <DialogDescription>
                  Select a material item and quantity to request for the selected project.
                </DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleCreateRequest)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="materialId">Material Item *</Label>
                  <select 
                    id="materialId" 
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                    {...register('materialId')}
                  >
                    <option value="">Select Material...</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                  {errors.materialId && <p className="text-xs text-destructive font-medium">{errors.materialId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierId">Preferred Supplier</Label>
                  <select 
                    id="supplierId" 
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
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

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" type="number" step="any" placeholder="e.g. 50" {...register('quantity')} />
                  {errors.quantity && <p className="text-xs text-destructive font-medium">{errors.quantity.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Delivery Notes / Remarks</Label>
                  <textarea 
                    id="notes" 
                    placeholder="Deliver to Colombo 07 site office. Urgent casting required."
                    className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                    {...register('notes')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Requesting...
                      </>
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

      {/* Tabs headers */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2 pb-px">
        {[
          { id: 'requests', label: 'Procurement Requests', icon: Truck },
          { id: 'inventory', label: 'Inventory Stock', icon: Layers },
          { id: 'suppliers', label: 'Suppliers directory', icon: Store }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                isActive 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-500 font-semibold' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels content */}
      <div className="pt-2">
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Filter and select */}
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <Label htmlFor="projectSelect" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Project</Label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="max-w-xs h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950"
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
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Requisition Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Material Item</th>
                          <th className="pb-3 font-semibold">Project Code</th>
                          <th className="pb-3 font-semibold">Quantity</th>
                          <th className="pb-3 font-semibold">Cost Estimate</th>
                          <th className="pb-3 font-semibold">Supplier</th>
                          <th className="pb-3 font-semibold">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((req, i) => (
                          <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{req.material.name}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">{req.project?.code || 'PRJ-001'}</td>
                            <td className="py-3.5 text-zinc-800 dark:text-zinc-200">{req.quantity} {req.material.unit}</td>
                            <td className="py-3.5 text-zinc-800 dark:text-zinc-200 font-semibold">LKR {(req.totalPrice || 0).toLocaleString()}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">{req.supplier?.name || 'N/A'}</td>
                            <td className="py-3.5">
                              {/* Simple dropdown for status shifts */}
                              <select 
                                value={req.status}
                                onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border focus:outline-none ${getRequestBadgeColor(req.status)}`}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="ORDERED">Ordered</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
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
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((m) => {
                  const isLow = m.currentStock <= m.minimumStock;
                  return (
                    <Card key={m.id} className={`border-zinc-200 dark:border-zinc-800 relative ${isLow ? 'ring-1 ring-amber-500/35 bg-amber-50/5 dark:bg-amber-950/5' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{m.category}</span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{m.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-zinc-100 dark:border-zinc-900 pb-2">
                          <span className="text-zinc-500 text-xs">Current Stock</span>
                          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {m.currentStock} <span className="text-xs text-zinc-400 font-semibold">{m.unit}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 text-xs pt-1">
                          <div>
                            <div className="text-zinc-400">Min Alert Stock</div>
                            <div className="font-bold text-zinc-700 dark:text-zinc-300">{m.minimumStock} {m.unit}</div>
                          </div>
                          <div>
                            <div className="text-zinc-400">Estimated Unit Cost</div>
                            <div className="font-bold text-zinc-700 dark:text-zinc-300">LKR {m.unitPrice.toLocaleString()}</div>
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
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suppliers.map((s) => (
                  <Card key={s.id} className="border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-500 font-bold">★ {s.rating || 5}.0 Rating</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Active</span>
                      </div>
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <div>
                        <strong className="text-zinc-700 dark:text-zinc-300">Contact:</strong> {s.contactPerson || 'N/A'}
                      </div>
                      <div>
                        <strong className="text-zinc-700 dark:text-zinc-300">Phone:</strong> {s.phone || 'N/A'}
                      </div>
                      {s.email && (
                        <div>
                          <strong className="text-zinc-700 dark:text-zinc-300">Email:</strong> {s.email}
                        </div>
                      )}
                      <div className="pt-2 flex flex-wrap gap-1 border-t border-zinc-100 dark:border-zinc-900">
                        {s.materialTypes.map((cat, idx) => (
                          <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
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
