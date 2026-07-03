'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2, MapPin, User, Calendar, Plus, Loader2, AlertCircle,
  TrendingUp, ChevronRight, HardHat, Phone, LayoutGrid, List,
  ArrowUpRight, Clock, CheckSquare, FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProgressBar } from '@/components/ui/custom-charts';
import { StatusBadge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyProjects } from '@/components/ui/empty-state';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  _count: { tasks: number; expenses: number; dailyReports: number; };
}

const projectSchema = z.object({
  name:           z.string().min(3, 'Project name must be at least 3 characters'),
  description:    z.string().optional(),
  clientName:     z.string().optional(),
  clientPhone:    z.string().optional(),
  location:       z.string().optional(),
  budgetEstimate: z.coerce.number().min(0, 'Budget must be positive'),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
  status:   z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const fmt = (n: number) => {
  if (n >= 1_000_000_000) return `LKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `LKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `LKR ${(n / 1_000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};

const priorityMeta: Record<string, { label: string; className: string }> = {
  URGENT: { label: 'Urgent', className: 'bg-danger-subtle border-danger/25 text-danger' },
  HIGH:   { label: 'High',   className: 'bg-warning-subtle border-warning/25 text-warning' },
  MEDIUM: { label: 'Medium', className: 'bg-info-subtle border-info/25 text-info' },
  LOW:    { label: 'Low',    className: 'bg-accent/50 border-border/25 text-muted-foreground' },
};

const STATUS_FILTERS = [
  { value: 'ALL',         label: 'All' },
  { value: 'IN_PROGRESS', label: 'Active' },
  { value: 'PLANNING',    label: 'Planning' },
  { value: 'ON_HOLD',     label: 'On Hold' },
  { value: 'COMPLETED',   label: 'Done' },
];

// ── Input style ─────────────────────────────────────────────
const inputCls = 'flex h-9 w-full rounded-xl border border-border/40 bg-accent/20 px-3 py-1.5 text-[13px] outline-none focus:border-foreground/30 focus:ring-2 focus:ring-ring/20 font-medium transition-all';

// ── Project card (grid view) ─────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const budgetPercent = project.budgetEstimate > 0
    ? Math.min(Math.round((project.budgetActual / project.budgetEstimate) * 100), 100)
    : 0;
  const pmeta = priorityMeta[project.priority] ?? priorityMeta.MEDIUM;
  const isOverBudget = budgetPercent > 90;
  const daysLeft = project.endDate
    ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <Link href={`/projects/${project.id}`} className="group block select-none">
      <Card className="h-full glass-panel shadow-surface hover:shadow-elevated hover:border-border/55 transition-all duration-250 rounded-2xl relative overflow-hidden border-border/25">
        {/* Priority indicator stripe */}
        <div
          className={cn('absolute top-0 left-0 right-0 h-[3px]', {
            'bg-danger':  project.priority === 'URGENT',
            'bg-warning': project.priority === 'HIGH',
            'bg-primary': project.priority === 'MEDIUM',
            'bg-muted':   project.priority === 'LOW',
          })}
          aria-hidden
        />

        <CardContent className="p-5 flex flex-col h-full text-left">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 font-mono">
              {project.code}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} size="sm" />
              <span className={cn('chip text-[9px]', pmeta.className)}>{pmeta.label}</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[17px] font-semibold text-foreground/90 group-hover:text-foreground leading-snug transition-colors mb-1 line-clamp-2">
            {project.name}
          </h2>
          <p className="text-[13px] text-muted-foreground/65 leading-relaxed flex-1 line-clamp-2 mb-4 font-medium">
            {project.description ?? 'No description provided for this site.'}
          </p>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.location && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/70 bg-accent/40 border border-border/20 px-2 py-0.5 rounded-lg">
                <MapPin className="w-3 h-3" aria-hidden /> {project.location}
              </span>
            )}
            {project.clientName && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/70 bg-accent/40 border border-border/20 px-2 py-0.5 rounded-lg">
                <User className="w-3 h-3" aria-hidden /> {project.clientName}
              </span>
            )}
            {daysLeft !== null && (
              <span className={cn(
                'flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border',
                daysLeft < 0
                  ? 'bg-danger-subtle border-danger/25 text-danger'
                  : daysLeft < 14
                  ? 'bg-warning-subtle border-warning/25 text-warning'
                  : 'bg-accent/40 border-border/20 text-muted-foreground/70'
              )}>
                <Clock className="w-3 h-3" aria-hidden />
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            )}
          </div>

          {/* Progress bars */}
          <div className="space-y-3 pt-3 border-t border-border/12 mt-auto">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground/60 mb-1.5">
                <span>Progress</span>
                <span className="font-bold text-foreground/75 font-mono">{project.progressPercent}%</span>
              </div>
              <ProgressBar value={project.progressPercent} height={4} />
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground/60 mb-1.5">
                <span>Budget used</span>
                <span className={cn('font-bold font-mono', isOverBudget ? 'text-danger' : 'text-foreground/75')}>
                  {budgetPercent}%
                </span>
              </div>
              <ProgressBar
                value={budgetPercent}
                height={4}
                color={isOverBudget ? 'oklch(0.60 0.20 22)' : undefined}
              />
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-border/12">
            {[
              { label: 'Tasks',    value: project._count.tasks,        icon: CheckSquare },
              { label: 'Logs',     value: project._count.dailyReports, icon: FileText },
              { label: 'Expenses', value: project._count.expenses,     icon: Building2 },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center py-2 bg-accent/15 border border-border/15 rounded-xl">
                <span className="text-[15px] font-bold text-foreground/85 font-mono">{s.value}</span>
                <span className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-widest mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Project list row ─────────────────────────────────────────
function ProjectRow({ project }: { project: Project }) {
  const budgetPercent = project.budgetEstimate > 0
    ? Math.min(Math.round((project.budgetActual / project.budgetEstimate) * 100), 100)
    : 0;

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/10 last:border-0 hover:bg-accent/30 transition-colors duration-150 cursor-pointer">
        {/* Status dot */}
        <StatusBadge status={project.status} size="sm" />

        {/* Name + code */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-foreground/90 group-hover:text-foreground transition-colors truncate">
            {project.name}
          </p>
          <p className="text-[11px] font-bold text-muted-foreground/45 font-mono mt-0.5">
            {project.code} {project.location ? `· ${project.location}` : ''}
          </p>
        </div>

        {/* Progress */}
        <div className="hidden md:flex flex-col w-28 gap-1">
          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground/55">
            <span>Progress</span><span className="font-mono">{project.progressPercent}%</span>
          </div>
          <ProgressBar value={project.progressPercent} height={3} />
        </div>

        {/* Budget */}
        <div className="hidden lg:flex flex-col w-24 text-right">
          <span className="text-[13px] font-semibold text-foreground/80 font-mono">{fmt(project.budgetEstimate)}</span>
          <span className="text-[10px] text-muted-foreground/45 font-mono">
            {budgetPercent}% used
          </span>
        </div>

        {/* Counts */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-muted-foreground/55 font-semibold">
          <span className="flex items-center gap-1">
            <CheckSquare className="w-3 h-3" aria-hidden /> {project._count.tasks}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" aria-hidden /> {project._count.dailyReports}
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground/25 group-hover:text-muted-foreground/55 transition-colors flex-shrink-0" aria-hidden />
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: Project[] }>({
    queryKey: ['projects', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL' ? '/projects' : `/projects?status=${statusFilter}`;
      return (await apiClient.get(url)).data;
    },
    retry: 1,
    staleTime: 30_000,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => (await apiClient.post('/projects', values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      resetForm();
      setMutateError(null);
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message ?? 'Failed to create project. Please try again.');
    },
  });

  const { register, handleSubmit, reset: resetForm, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '', description: '', clientName: '', clientPhone: '',
      location: '', budgetEstimate: 0, status: 'PLANNING' as const, priority: 'MEDIUM' as const,
    },
  });

  const projects = data?.data ?? [];
  const counts = STATUS_FILTERS.map(f => ({
    ...f,
    count: f.value === 'ALL'
      ? projects.length
      : (data?.data ?? []).filter(p => p.status === f.value).length,
  }));

  return (
    <div className="space-y-5 pb-12" aria-label="Projects">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="text-left select-none">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground/90">
            Project Workspaces
          </h1>
          <p className="text-[13px] text-muted-foreground/65 mt-0.5 font-medium">
            Track active sites, budgets, timelines, and workforce progress.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" aria-hidden />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border/25 rounded-2xl shadow-modal text-left">
            <DialogHeader className="border-b border-border/15 pb-4 mb-4">
              <DialogTitle className="text-[15px] font-bold">Create Project</DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground/65 mt-0.5">
                Initialize a new construction workspace with budget and timeline tracking.
              </DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert className="bg-danger-subtle border-danger/25 rounded-xl mb-4">
                <AlertCircle className="h-4 w-4 text-danger" aria-hidden />
                <AlertTitle className="text-[11px] font-bold uppercase tracking-wider text-danger">Error</AlertTitle>
                <AlertDescription className="text-[12px] text-danger/80">{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit((v) => { setMutateError(null); createProjectMutation.mutate(v); })} className="space-y-4">
              {/* Project name */}
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-[12px] font-semibold text-foreground/80">
                  Project Name <span className="text-danger">*</span>
                </Label>
                <Input id="proj-name" placeholder="Horizon Tower Phase II" {...register('name')} className={inputCls} />
                {errors.name && <p className="text-[11px] text-danger font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-desc" className="text-[12px] font-semibold text-foreground/80">Description</Label>
                <Input id="proj-desc" placeholder="10-floor residential complex" {...register('description')} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-client" className="text-[12px] font-semibold text-foreground/80">Client Name</Label>
                  <Input id="proj-client" placeholder="Mr. Rajapaksa" {...register('clientName')} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-phone" className="text-[12px] font-semibold text-foreground/80">Client Phone</Label>
                  <Input id="proj-phone" placeholder="+94 77 123 4567" {...register('clientPhone')} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-loc" className="text-[12px] font-semibold text-foreground/80">Location</Label>
                  <Input id="proj-loc" placeholder="Negombo, LK" {...register('location')} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-budget" className="text-[12px] font-semibold text-foreground/80">
                    Budget (LKR) <span className="text-danger">*</span>
                  </Label>
                  <Input id="proj-budget" type="number" min="0" placeholder="5000000" {...register('budgetEstimate')} className={inputCls} />
                  {errors.budgetEstimate && <p className="text-[11px] text-danger font-semibold">{errors.budgetEstimate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-start" className="text-[12px] font-semibold text-foreground/80">Start Date</Label>
                  <Input id="proj-start" type="date" {...register('startDate')} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-end" className="text-[12px] font-semibold text-foreground/80">End Date</Label>
                  <Input id="proj-end" type="date" {...register('endDate')} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-status" className="text-[12px] font-semibold text-foreground/80">Status</Label>
                  <select id="proj-status" className={inputCls} {...register('status')}>
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-priority" className="text-[12px] font-semibold text-foreground/80">Priority</Label>
                  <select id="proj-priority" className={inputCls} {...register('priority')}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/15">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} loadingText="Creating…">
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters + View toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 select-none">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all duration-200 whitespace-nowrap border',
                statusFilter === f.value
                  ? 'bg-foreground text-background border-transparent shadow-surface'
                  : 'bg-accent/40 border-border/20 text-muted-foreground/75 hover:text-foreground hover:bg-accent/70'
              )}
              aria-pressed={statusFilter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-accent/40 rounded-xl p-1 border border-border/20 flex-shrink-0">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              view === 'grid' ? 'bg-card shadow-surface text-foreground' : 'text-muted-foreground/50 hover:text-foreground'
            )}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              view === 'list' ? 'bg-card shadow-surface text-foreground' : 'text-muted-foreground/50 hover:text-foreground'
            )}
            aria-label="List view"
            aria-pressed={view === 'list'}
          >
            <List className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && projects.length > 0 && (
        <p className="text-[12px] text-muted-foreground/50 font-medium select-none">
          {projects.length} project{projects.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="bg-card border border-border/25 rounded-2xl overflow-hidden shadow-surface">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/10 last:border-0">
                <div className="h-5 w-16 rounded-full shimmer-bg bg-accent" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-48 rounded shimmer-bg bg-accent" />
                  <div className="h-2.5 w-32 rounded shimmer-bg bg-accent" />
                </div>
                <div className="h-2 w-24 rounded-full shimmer-bg bg-accent hidden md:block" />
              </div>
            ))}
          </div>
        )
      )}

      {/* Empty state */}
      {!isLoading && projects.length === 0 && (
        <div className="glass-panel border-border/25 rounded-2xl">
          <EmptyProjects onCreateClick={() => setIsDialogOpen(true)} />
        </div>
      )}

      {/* Grid view */}
      {!isLoading && projects.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {/* List view */}
      {!isLoading && projects.length > 0 && view === 'list' && (
        <div className="bg-card border border-border/25 rounded-2xl overflow-hidden shadow-surface">
          {/* List header */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-border/20 bg-accent/20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-20">Status</span>
            <span className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Project</span>
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-28">Progress</span>
            <span className="hidden lg:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-24 text-right">Budget</span>
            <span className="hidden lg:block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 w-16">Activity</span>
            <span className="w-4" />
          </div>
          {projects.map(p => <ProjectRow key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
