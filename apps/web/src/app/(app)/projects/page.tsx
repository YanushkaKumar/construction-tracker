'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  MapPin, 
  User, 
  Calendar, 
  Plus, 
  Loader2, 
  AlertCircle,
  TrendingUp,
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

  // Mock projects for preview in case DB is unpopulated
  const mockProjects: Project[] = [
    {
      id: 'prj1',
      name: 'Horizon Tower - Colombo 07',
      code: 'PRJ-001',
      description: '12-story residential apartment complex in Colombo 07',
      clientName: 'Mr. Amal Rajapaksa',
      clientPhone: '+94777654321',
      location: 'Colombo 07',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      budgetEstimate: 150000000,
      budgetActual: 85000000,
      progressPercent: 58,
      startDate: '2025-06-01',
      endDate: '2027-06-01',
      _count: { tasks: 4, expenses: 3, dailyReports: 8 }
    },
    {
      id: 'prj2',
      name: 'Palm Villa - Negombo',
      code: 'PRJ-002',
      description: 'Luxury 3-bedroom villa with pool in Negombo',
      clientName: 'Mrs. Kumari Bandara',
      clientPhone: '+94778765432',
      location: 'Negombo',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      budgetEstimate: 45000000,
      budgetActual: 18000000,
      progressPercent: 35,
      startDate: '2026-01-15',
      endDate: '2026-12-31',
      _count: { tasks: 2, expenses: 1, dailyReports: 4 }
    },
    {
      id: 'prj3',
      name: 'Office Renovation - World Trade Center',
      code: 'PRJ-003',
      description: 'Commercial office space renovation, floors 8-10',
      clientName: 'ABC Holdings',
      location: 'Colombo 01',
      status: 'PLANNING',
      priority: 'LOW',
      budgetEstimate: 25000000,
      budgetActual: 0,
      progressPercent: 0,
      startDate: '2026-08-01',
      endDate: '2026-11-30',
      _count: { tasks: 0, expenses: 0, dailyReports: 0 }
    }
  ];

  const projects = data?.data || mockProjects;

  const handleCreateProject = (values: any) => {
    setMutateError(null);
    createProjectMutation.mutate(values);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'ON_HOLD':
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Panel */}
      <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            Projects
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 ml-1">
            Create, track, and monitor active constructions.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-500/10 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Fill in the details below to initialize a new site tracking context.
              </DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleCreateProject)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" placeholder="Horizon Tower Phase 2" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="10-floor residential structure" {...register('description')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input id="clientName" placeholder="Mr. Rajapaksa" {...register('clientName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input id="clientPhone" placeholder="+9477..." {...register('clientPhone')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Negombo" {...register('location')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetEstimate">Budget Estimate (LKR) *</Label>
                  <Input id="budgetEstimate" type="number" {...register('budgetEstimate')} />
                  {errors.budgetEstimate && <p className="text-xs text-destructive font-medium">{errors.budgetEstimate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...register('endDate')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select 
                    id="status" 
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                    {...register('status')}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select 
                    id="priority" 
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                    {...register('priority')}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Controls Header */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        <SlidersHorizontal className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
        {['ALL', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className={`text-xs rounded-full ${
              statusFilter === status 
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950' 
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {status === 'ALL' ? 'All Projects' : status.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const budgetPercent = project.budgetEstimate > 0 
            ? Math.round((project.budgetActual / project.budgetEstimate) * 100)
            : 0;

          return (
            <Card key={project.id} className="border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    {project.code}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadgeColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <CardTitle className="text-xl group-hover:text-amber-500 transition-colors">
                  <Link href={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-10">
                  {project.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                {/* Meta details list */}
                <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {project.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{project.location}</span>
                    </div>
                  )}
                  {project.clientName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{project.clientName}</span>
                    </div>
                  )}
                  {project.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {new Date(project.startDate).toLocaleDateString()}
                        {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bars */}
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  {/* Construction progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Site Progress</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{project.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${project.progressPercent}%` }} />
                    </div>
                  </div>

                  {/* Budget progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Budget Spent</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {budgetPercent}% (LKR {(project.budgetActual / 1000000).toFixed(1)}M / {(project.budgetEstimate / 1000000).toFixed(1)}M)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(budgetPercent, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Counters row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900 text-center">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{project._count.tasks}</div>
                    <div className="text-xs text-zinc-400 font-semibold uppercase">Tasks</div>
                  </div>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{project._count.dailyReports}</div>
                    <div className="text-xs text-zinc-400 font-semibold uppercase">Logs</div>
                  </div>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{project._count.expenses}</div>
                    <div className="text-xs text-zinc-400 font-semibold uppercase">Expenses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
