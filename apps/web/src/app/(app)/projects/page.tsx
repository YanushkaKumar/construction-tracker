'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, MapPin, User, Calendar, Plus, Loader2, AlertCircle,
  TrendingUp, ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProgressBar } from '@/components/ui/custom-charts';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  location?: string;
  status: string;
  priority: string;
  budgetEstimate: number;
  budgetActual: number;
  progressPercent: number;
  startDate?: string;
  endDate?: string;
  _count: {
    tasks: number;
    expenses: number;
    dailyReports: number;
  };
}

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  location: z.string().optional(),
  budgetEstimate: z.coerce.number().min(0, 'Budget estimate must be positive'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const statusMeta: Record<string, { label: string; dotClass: string }> = {
  PLANNING: { label: 'Planning', dotClass: 'status-planning' },
  IN_PROGRESS: { label: 'Active', dotClass: 'status-active' },
  ON_HOLD: { label: 'Paused', dotClass: 'status-paused' },
  COMPLETED: { label: 'Done', dotClass: 'status-complete' },
  CANCELLED: { label: 'Cancelled', dotClass: 'status-critical' },
};

const fmt = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: Project[] }>({
    queryKey: ['projects', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL' ? '/projects' : `/projects?status=${statusFilter}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    retry: 1,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const response = await apiClient.post('/projects', values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to create project');
    }
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      clientName: '',
      clientPhone: '',
      location: '',
      budgetEstimate: 0,
      status: 'PLANNING' as const,
      priority: 'MEDIUM' as const,
    },
  });

  const projects = data?.data || [];

  const handleCreateProject = (values: any) => {
    setMutateError(null);
    createProjectMutation.mutate(values);
  };

  const filters = [
    { value: 'ALL', label: 'All' },
    { value: 'IN_PROGRESS', label: 'Active' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'ON_HOLD', label: 'Paused' },
    { value: 'COMPLETED', label: 'Done' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Projects</h1>
          <p className="text-caption mt-1">Manage construction sites, budgets, and progress tracking.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Set up a new construction site tracking context.</DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleCreateProject)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-caption">Project Name *</Label>
                <Input id="name" placeholder="Horizon Tower Phase 2" {...register('name')} />
                {errors.name && <p className="text-[10px] text-destructive font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-caption">Description</Label>
                <Input id="description" placeholder="10-floor residential structure" {...register('description')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-caption">Client Name</Label>
                  <Input id="clientName" placeholder="Mr. Rajapaksa" {...register('clientName')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientPhone" className="text-caption">Client Phone</Label>
                  <Input id="clientPhone" placeholder="+9477..." {...register('clientPhone')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-caption">Location</Label>
                  <Input id="location" placeholder="Negombo" {...register('location')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="budgetEstimate" className="text-caption">Budget (LKR) *</Label>
                  <Input id="budgetEstimate" type="number" {...register('budgetEstimate')} />
                  {errors.budgetEstimate && <p className="text-[10px] text-destructive font-medium">{errors.budgetEstimate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-caption">Start Date</Label>
                  <Input id="startDate" type="date" {...register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-caption">End Date</Label>
                  <Input id="endDate" type="date" {...register('endDate')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-caption">Status</Label>
                  <select 
                    id="status" 
                    className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
                    {...register('status')}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-caption">Priority</Label>
                  <select 
                    id="priority" 
                    className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
                    {...register('priority')}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating…</>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ═══ Filters — Pill style ═══ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              statusFilter === f.value
                ? 'bg-foreground text-background'
                : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ═══ Loading ═══ */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-card shadow-surface shimmer-bg" />
          ))}
        </div>
      )}

      {/* ═══ Empty State ═══ */}
      {projects.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-title text-foreground mb-1">No projects yet</p>
          <p className="text-caption max-w-xs">Create your first construction project to start tracking budgets, tasks, and progress.</p>
        </div>
      )}

      {/* ═══ Project Cards ═══ */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {projects.map((project) => {
            const budgetPercent = project.budgetEstimate > 0
              ? Math.round((project.budgetActual / project.budgetEstimate) * 100)
              : 0;
            const meta = statusMeta[project.status] || { label: project.status, dotClass: '' };

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full group cursor-pointer hover:shadow-panel transition-all duration-300">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-label text-muted-foreground/50">{project.code}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`status-dot ${meta.dotClass}`} />
                        <span className="text-[10px] font-medium text-muted-foreground">{meta.label}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-title text-foreground group-hover:text-foreground/80 transition-colors mb-1">
                      {project.name}
                    </h3>
                    <p className="text-caption line-clamp-1 mb-4">
                      {project.description || 'No description'}
                    </p>

                    {/* Meta */}
                    <div className="space-y-1.5 mb-4 flex-1">
                      {project.location && (
                        <div className="flex items-center gap-2 text-caption">
                          <MapPin className="w-3 h-3 text-muted-foreground/40" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {project.clientName && (
                        <div className="flex items-center gap-2 text-caption">
                          <User className="w-3 h-3 text-muted-foreground/40" />
                          <span>{project.clientName}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-3 pt-3 border-t border-border/40">
                      <ProgressBar value={project.progressPercent} label="Progress" showLabel height={4} />
                      <ProgressBar
                        value={budgetPercent}
                        label={`Budget · LKR ${fmt(project.budgetActual)} / ${fmt(project.budgetEstimate)}`}
                        showLabel
                        height={4}
                        color={budgetPercent > 90 ? 'oklch(0.63 0.22 25)' : undefined}
                      />
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-border/40">
                      <CountStat value={project._count.tasks} label="Tasks" />
                      <CountStat value={project._count.dailyReports} label="Logs" />
                      <CountStat value={project._count.expenses} label="Expenses" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CountStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center py-1">
      <div className="text-sm font-semibold text-foreground text-financial">{value}</div>
      <div className="text-label text-muted-foreground/40 text-[8px] mt-0.5">{label}</div>
    </div>
  );
}
