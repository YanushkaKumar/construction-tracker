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

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";
  const textareaStyle = "flex min-h-[60px] w-full rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 resize-none placeholder:text-muted-foreground/50 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">Daily Site Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Record personnel registers, weather conditions, and work summaries daily.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold h-10 rounded-xl transition-all shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Submit Daily Log
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
            <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
              <DialogTitle className="text-sm font-bold text-foreground">Submit Site Log</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Provide key details of operations logged on site today.</DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4">
                <AlertCircle className="h-4 w-4 text-danger" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">Logging Error</AlertTitle>
                <AlertDescription className="text-xs font-semibold">{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleCreateLog)} className="space-y-4 font-semibold text-left">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="reportDate" className="text-xs font-semibold text-foreground/80">Report Date *</Label>
                  <Input id="reportDate" type="date" {...register('reportDate')} className={inputStyle} />
                  {errors.reportDate && <p className="text-[10px] text-danger font-bold">{errors.reportDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workersOnSite" className="text-xs font-semibold text-foreground/80">Workers On Site *</Label>
                  <Input id="workersOnSite" type="number" {...register('workersOnSite')} className={inputStyle} />
                  {errors.workersOnSite && <p className="text-[10px] text-danger font-bold">{errors.workersOnSite.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weatherCondition" className="text-xs font-semibold text-foreground/80">Weather Condition *</Label>
                <select 
                  id="weatherCondition" 
                  className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
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
                <Label htmlFor="workSummary" className="text-xs font-semibold text-foreground/80">Work Summary *</Label>
                <textarea 
                  id="workSummary" 
                  placeholder="Completed slab casting of ground floor..."
                  {...register('workSummary')}
                  className={textareaStyle}
                />
                  {errors.workSummary && <p className="text-[10px] text-danger font-bold">{errors.workSummary.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="issues" className="text-xs font-semibold text-foreground/80">Issues/Bottlenecks</Label>
                <textarea 
                  id="issues" 
                  placeholder="Delays, material shortages..."
                  {...register('issues')}
                  className={textareaStyle}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="safetyNotes" className="text-xs font-semibold text-foreground/80">Safety Notes</Label>
                <textarea 
                  id="safetyNotes" 
                  placeholder="Scaffolding inspections..."
                  {...register('safetyNotes')}
                  className={textareaStyle}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting…</>
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
      <div className="flex items-center gap-3 p-3.5 bg-accent/15 border border-border/20 rounded-xl select-none text-left">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
        <Label htmlFor="projectSelect" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap font-mono font-bold">Filter Workspace</Label>
        <select
          id="projectSelect"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={selectStyle + ' max-w-xs h-9'}
        >
          <option value="ALL">All Company Logs</option>
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
            <div key={i} className="h-44 rounded-xl bg-accent/15 border border-border/20 shimmer-bg animate-pulse" />
          ))}
        </div>
      )}

      {/* Logs Timeline Feed */}
      <div className="space-y-3.5 max-w-4xl font-semibold">
        {dailyLogs.length === 0 && !isLogsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center select-none glass-panel border-border/30 rounded-2xl">
            <FolderOpen className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
            <p className="text-sm font-bold text-foreground mb-1">No daily logs found</p>
            <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed font-sans">Submit the first site log to catalog progress.</p>
          </div>
        ) : (
          dailyLogs.map((log) => (
            <Card key={log.id} className="relative overflow-hidden transition-all duration-200 hover:shadow-panel border-border/25 bg-card/65 backdrop-blur-xl">
              <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-foreground/50" />
              
              <CardContent className="p-4 pl-6 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/15 pb-2.5">
                  <div className="flex items-center gap-2 select-none">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/45" />
                    <span className="text-[15px] font-bold text-foreground">
                      {new Date(log.reportDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground/60 uppercase tracking-wider select-none font-mono font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-muted-foreground/45" />
                      Weather: <strong className="text-foreground">{log.weatherCondition}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground/45" />
                      Crew Size: <strong className="text-foreground text-financial">{log.workersOnSite} on site</strong>
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold text-muted-foreground/55 uppercase tracking-wider flex items-center gap-1.5 select-none font-mono">
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground/45" />
                    Work Summary & Progress
                  </h5>
                  <p className="text-[15px] text-foreground/80 leading-relaxed font-medium">
                    {log.workSummary}
                  </p>
                </div>

                {(log.issues || log.safetyNotes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5 border-t border-border/15">
                    {log.issues && (
                      <div className="p-3 bg-danger-subtle/10 border border-danger/25 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-danger uppercase tracking-wider flex items-center gap-1.5 select-none font-mono">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Bottlenecks / Issues
                        </div>
                        <p className="text-[15px] text-danger/80 leading-relaxed font-semibold font-sans">
                          {log.issues}
                        </p>
                      </div>
                    )}

                    {log.safetyNotes && (
                      <div className="p-3 bg-success-subtle/10 border border-success/25 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5 select-none font-mono">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Safety Observations
                        </div>
                        <p className="text-[15px] text-success/80 leading-relaxed font-semibold font-sans">
                          {log.safetyNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[13px] text-muted-foreground/70 pt-1 flex items-center justify-between border-t border-border/15 select-none">
                  <span>Logged by: <strong className="text-foreground/80 font-bold">{log.reporter?.firstName} {log.reporter?.lastName}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
