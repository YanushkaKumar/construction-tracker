'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileSpreadsheet, Plus, Loader2, AlertCircle, CloudSun, Users,
  ClipboardList, ShieldAlert, Calendar, SlidersHorizontal, FolderOpen
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DailyLog {
  id: string;
  projectId: string;
  reportDate: string;
  weatherCondition?: string;
  workSummary: string;
  issues?: string;
  safetyNotes?: string;
  workersOnSite: number;
  notes?: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const logSchema = z.object({
  reportDate: z.string().min(1, 'Log date is required'),
  weatherCondition: z.string().default('Sunny'),
  workSummary: z.string().min(5, 'Work summary must be at least 5 characters'),
  issues: z.string().optional(),
  safetyNotes: z.string().optional(),
  workersOnSite: z.coerce.number().min(0, 'Worker count must be positive'),
  notes: z.string().optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

export default function DailyReportsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [mutateError, setMutateError] = useState<string | null>(null);

  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery<{ data: DailyLog[] }>({
    queryKey: ['daily-logs', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL' || selectedProjectId === '') {
        return (await apiClient.get(`/daily-reports`)).data;
      }
      return (await apiClient.get(`/projects/${selectedProjectId}/daily-reports`)).data;
    },
    retry: 1,
  });

  const createLogMutation = useMutation({
    mutationFn: async (values: LogFormValues) => {
      return (await apiClient.post(`/projects/${selectedProjectId}/daily-reports`, values)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to submit log');
    }
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(logSchema),
    defaultValues: {
      reportDate: new Date().toISOString().split('T')[0],
      weatherCondition: 'Sunny',
      workSummary: '',
      issues: '',
      safetyNotes: '',
      workersOnSite: 0,
      notes: '',
    },
  });

  const projectsList = projectsData?.data || [];
  const dailyLogs = logsData?.data || [];

  const handleCreateLog = (values: any) => {
    if (selectedProjectId === 'ALL') {
      setMutateError('Please select a specific project first to log the daily report.');
      return;
    }
    setMutateError(null);
    createLogMutation.mutate(values);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Daily Logs</h1>
          <p className="text-caption mt-1">Record site registers, weather briefings, and work summaries daily.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              Submit Daily Log
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Site Log</DialogTitle>
              <DialogDescription>Provide key details of operations logged on site today.</DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleCreateLog)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reportDate" className="text-caption">Report Date *</Label>
                  <Input id="reportDate" type="date" {...register('reportDate')} />
                  {errors.reportDate && <p className="text-[10px] text-destructive font-medium">{errors.reportDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workersOnSite" className="text-caption">Workers On Site *</Label>
                  <Input id="workersOnSite" type="number" {...register('workersOnSite')} />
                  {errors.workersOnSite && <p className="text-[10px] text-destructive font-medium">{errors.workersOnSite.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weatherCondition" className="text-caption">Weather Condition *</Label>
                <select 
                  id="weatherCondition" 
                  className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
                  {...register('weatherCondition')}
                >
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy (Light)">Rainy (Light)</option>
                  <option value="Rainy (Heavy)">Rainy (Heavy)</option>
                  <option value="Stormy">Stormy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="workSummary" className="text-caption">Work Summary *</Label>
                <textarea 
                  id="workSummary" 
                  placeholder="Completed slab casting of ground floor..."
                  rows={3}
                  className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 resize-none placeholder:text-muted-foreground/60"
                  {...register('workSummary')}
                />
                {errors.workSummary && <p className="text-[10px] text-destructive font-medium">{errors.workSummary.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="issues" className="text-caption">Issues/Bottlenecks</Label>
                <textarea 
                  id="issues" 
                  placeholder="Delays, material shortages..."
                  rows={2}
                  className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 resize-none placeholder:text-muted-foreground/60"
                  {...register('issues')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="safetyNotes" className="text-caption">Safety Notes</Label>
                <textarea 
                  id="safetyNotes" 
                  placeholder="Scaffolding inspections..."
                  rows={2}
                  className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 resize-none placeholder:text-muted-foreground/60"
                  {...register('safetyNotes')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting…</>
                  ) : (
                    'Submit Log'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selector Banner */}
      <div className="flex items-center gap-3 p-4 bg-accent/20 border border-border/30 rounded-2xl">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
        <Label htmlFor="projectSelect" className="text-label text-muted-foreground/60 whitespace-nowrap">Select Project</Label>
        <select
          id="projectSelect"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="max-w-xs h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30"
        >
          <option value="ALL">All Demo Logs</option>
          {projectsList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>
      </div>

      {isLogsLoading && (
        <div className="space-y-4 max-w-4xl">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-accent/20 shimmer-bg" />
          ))}
        </div>
      )}

      {/* Logs Timeline Feed */}
      <div className="space-y-4 max-w-4xl">
        {dailyLogs.length === 0 && !isLogsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-title text-foreground mb-1">No daily logs found</p>
            <p className="text-caption">Submit the first site log to catalog progress.</p>
          </div>
        ) : (
          dailyLogs.map((log) => (
            <Card key={log.id} className="relative overflow-hidden transition-all duration-200 hover:shadow-panel">
              <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-foreground/60" />
              
              <CardContent className="p-5 pl-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-semibold text-foreground">
                      {new Date(log.reportDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-muted-foreground/40" />
                      Weather: <strong className="text-foreground">{log.weatherCondition}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground/40" />
                      Crew Size: <strong className="text-foreground text-financial">{log.workersOnSite} on site</strong>
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground/40" />
                    Work Summary & Progress
                  </h5>
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                    {log.workSummary}
                  </p>
                </div>

                {(log.issues || log.safetyNotes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border/20">
                    {log.issues && (
                      <div className="p-3 bg-danger-subtle rounded-xl space-y-1.5">
                        <div className="text-[9px] font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Bottlenecks / Issues
                        </div>
                        <p className="text-xs text-danger/80 leading-relaxed font-medium">
                          {log.issues}
                        </p>
                      </div>
                    )}

                    {log.safetyNotes && (
                      <div className="p-3 bg-success-subtle rounded-xl space-y-1.5">
                        <div className="text-[9px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Safety Observations
                        </div>
                        <p className="text-xs text-success/80 leading-relaxed font-medium">
                          {log.safetyNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-caption pt-1 flex items-center justify-between">
                  <span>Logged by: <strong className="text-foreground/80 font-medium">{log.reporter?.firstName} {log.reporter?.lastName}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
