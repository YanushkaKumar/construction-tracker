'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileSpreadsheet, 
  Plus, 
  Loader2, 
  AlertCircle,
  CloudSun,
  Users,
  ClipboardList,
  ShieldAlert,
  Calendar,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Fetch projects list
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data;
    },
    retry: 1,
  });

  // Fetch daily logs
  const { data: logsData, isLoading: isLogsLoading } = useQuery<{ data: DailyLog[] }>({
    queryKey: ['daily-logs', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL' || selectedProjectId === '') {
        const response = await apiClient.get(`/daily-reports`);
        return response.data;
      }
      const response = await apiClient.get(`/projects/${selectedProjectId}/daily-reports`);
      return response.data;
    },
    retry: 1,
  });

  const createLogMutation = useMutation({
    mutationFn: async (values: LogFormValues) => {
      const response = await apiClient.post(`/projects/${selectedProjectId}/daily-reports`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Daily Site Logs
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Log workforce registers, weather conditions, and progress logs daily.
          </p>
        </div>

        {/* Create Dialog Trigger */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/10" />}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Daily Log
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Daily Site Log</DialogTitle>
              <DialogDescription>
                Provide key summaries of operations logged on site today.
              </DialogDescription>
            </DialogHeader>

            {mutateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{mutateError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleCreateLog)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportDate">Report Date *</Label>
                  <Input id="reportDate" type="date" {...register('reportDate')} />
                  {errors.reportDate && <p className="text-xs text-destructive font-medium">{errors.reportDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workersOnSite">Workers On Site *</Label>
                  <Input id="workersOnSite" type="number" {...register('workersOnSite')} />
                  {errors.workersOnSite && <p className="text-xs text-destructive font-medium">{errors.workersOnSite.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weatherCondition">Weather Condition *</Label>
                <select 
                  id="weatherCondition" 
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                  {...register('weatherCondition')}
                >
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy (Light)">Rainy (Light)</option>
                  <option value="Rainy (Heavy)">Rainy (Heavy)</option>
                  <option value="Stormy">Stormy</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workSummary">Work Summary *</Label>
                <textarea 
                  id="workSummary" 
                  placeholder="Completed casting of column C3. Installed block walls on ground floor..."
                  className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                  {...register('workSummary')}
                />
                {errors.workSummary && <p className="text-xs text-destructive font-medium">{errors.workSummary.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issues">Issues/Bottlenecks</Label>
                <textarea 
                  id="issues" 
                  placeholder="Any delays, material shortages, or subcontractor issues..."
                  className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                  {...register('issues')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safetyNotes">Safety Notes/Observations</Label>
                <textarea 
                  id="safetyNotes" 
                  placeholder="Scaffolding inspections, safety briefings, or incidents..."
                  className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
                  {...register('safetyNotes')}
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
                      Submitting...
                    </>
                  ) : (
                    'Submit Log'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selector banner */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <SlidersHorizontal className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        <Label htmlFor="projectSelect" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Project</Label>
        <select
          id="projectSelect"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="max-w-xs h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950"
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
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Logs Timeline */}
      <div className="space-y-6 max-w-4xl">
        {dailyLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
            <FolderOpen className="w-10 h-10 text-zinc-300" />
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No daily logs found</p>
              <p className="text-xs text-zinc-500 mt-1">Submit the first site log for this construction project.</p>
            </div>
          </div>
        ) : (
          dailyLogs.map((log) => (
            <Card key={log.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              
              <CardHeader className="pb-3 pl-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {new Date(log.reportDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <CloudSun className="w-3.5 h-3.5 text-zinc-400" />
                    Weather: <strong className="text-zinc-700 dark:text-zinc-300">{log.weatherCondition}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    Crew Size: <strong className="text-zinc-700 dark:text-zinc-300">{log.workersOnSite} on site</strong>
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pl-8 pt-4 space-y-4">
                {/* Work summary */}
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                    Work Summary & Progress
                  </h5>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {log.workSummary}
                  </p>
                </div>

                {/* Grid details (Issues & safety) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  {/* Bottlenecks/Issues */}
                  {log.issues && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-900">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        Bottlenecks / Issues
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {log.issues}
                      </p>
                    </div>
                  )}

                  {/* Safety logs */}
                  {log.safetyNotes && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-900">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                        Safety Observations
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {log.safetyNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-2">
                  <span>Logged by: <strong className="text-zinc-600 dark:text-zinc-400">{log.reporter?.firstName} {log.reporter?.lastName}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
