'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, MapPin, User, Calendar, ArrowLeft, Phone, Mail, 
  Plus, Loader2, CheckSquare, FileSpreadsheet, Landmark, AlertCircle,
  Clock, ShieldAlert, Sparkles, TrendingUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BOQTab } from './components/BOQTab';
import { DonutChart, ProgressBar } from '@/components/ui/custom-charts';
import { cn } from '@/lib/utils';

interface ProjectMember {
  id: string;
  projectRole: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
}

interface ProjectDetails {
  id: string;
  name: string;
  code: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  location?: string;
  status: string;
  priority: string;
  budgetEstimate: number;
  budgetActual: number;
  progressPercent: number;
  startDate?: string;
  endDate?: string;
  members: ProjectMember[];
  totalAdvance?: number;
  totalSpent?: number;
  remainingAdvance?: number;
  _count: {
    tasks: number;
    expenses: number;
    dailyReports: number;
    attendance: number;
  };
}

const catLabel: Record<string, string> = {
  PROJECT_MATERIAL: 'Material',
  SHARED_TOOL: 'Shared Tool',
  DAILY_EXPENSE: 'Daily Expense',
  SERVICE: 'Service',
  TRANSPORT: 'Transport',
  OTHER: 'Other',
};

const statusMeta: Record<string, { label: string; dotClass: string }> = {
  PLANNING: { label: 'Planning', dotClass: 'status-planning' },
  IN_PROGRESS: { label: 'Active', dotClass: 'status-active' },
  ON_HOLD: { label: 'Paused', dotClass: 'status-paused' },
  COMPLETED: { label: 'Done', dotClass: 'status-complete' },
  CANCELLED: { label: 'Cancelled', dotClass: 'status-critical' },
};

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { data: project, isLoading } = useQuery<ProjectDetails>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${id}`);
      return response.data;
    },
    retry: 1,
  });

  const { data: projectPurchases, isLoading: isPurchasesLoading } = useQuery<any[]>({
    queryKey: ['project-purchases', id],
    queryFn: async () => (await apiClient.get(`/purchases?projectId=${id}`)).data,
    retry: 1,
  });

  const { data: projectTasks, isLoading: isTasksLoading } = useQuery<any[]>({
    queryKey: ['project-tasks', id],
    queryFn: async () => (await apiClient.get(`/projects/${id}/tasks`)).data,
    retry: 1,
  });

  const { data: projectLogsData, isLoading: isLogsLoading } = useQuery<{ data: any[] }>({
    queryKey: ['project-daily-logs', id],
    queryFn: async () => (await apiClient.get(`/projects/${id}/daily-reports`)).data,
    retry: 1,
  });

  if (isLoading || !project) {
    return (
      <div className="flex h-[50vh] items-center justify-center font-semibold">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 font-mono">Loading project workspace…</span>
        </div>
      </div>
    );
  }

  const budgetPercent = project.budgetEstimate > 0 
    ? Math.round((project.budgetActual / project.budgetEstimate) * 100)
    : 0;

  const expensesByCategory = (projectPurchases || []).reduce((acc: Record<string, number>, curr: any) => {
    const allocation = curr.allocations?.find((a: any) => a.projectId === id);
    const amount = allocation ? Number(allocation.amount) : Number(curr.totalAmount);
    const cat = curr.category || 'OTHER';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += amount;
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory).map(([category, total]) => {
    const categoryColors: Record<string, string> = {
      PROJECT_MATERIAL: 'oklch(0.72 0.14 55)',
      SHARED_TOOL: 'oklch(0.60 0.16 310)',
      DAILY_EXPENSE: 'oklch(0.65 0.18 25)',
      SERVICE: 'oklch(0.68 0.10 200)',
      TRANSPORT: 'oklch(0.62 0.14 340)',
      OTHER: 'oklch(0.50 0.05 60)',
    };
    return {
      label: catLabel[category] || category,
      value: total as number,
      color: categoryColors[category] || 'oklch(0.50 0.05 60)',
    };
  });

  const tasksList = projectTasks || [];
  const dailyLogsList = projectLogsData?.data || [];
  const meta = statusMeta[project.status] || { label: project.status, dotClass: '' };

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* ═══ Header/Navigation ═══ */}
      <div className="flex flex-col gap-2 border-b border-border/25 pb-4">
        <Link href="/projects" className="inline-flex items-center text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-foreground transition-colors select-none font-mono">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-left select-none">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-muted-foreground/50 font-mono">{project.code}</span>
              <div className="flex items-center gap-1.5">
                <span className={`status-dot ${meta.dotClass}`} />
                <span className="text-[13px] font-semibold text-muted-foreground">{meta.label}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">{project.name}</h1>
          </div>
        </div>
      </div>

      {/* ═══ Overview Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Core Summary */}
        <Card className="lg:col-span-2 glass-panel border-border/30 shadow-panel">
          <CardContent className="p-5 space-y-4 font-semibold">
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 select-none">Project Scope</h3>
              <p className="text-[15px] lg:text-[16px] text-foreground/80 leading-relaxed">{project.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[13px] text-muted-foreground select-none">
                  <span>Construction Progress</span>
                  <span className="text-foreground font-mono">{project.progressPercent}%</span>
                </div>
                <ProgressBar value={project.progressPercent} height={4} />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[13px] text-muted-foreground select-none">
                  <span>Financial Budget Spent ({budgetPercent}%)</span>
                  <span className="text-foreground font-mono">LKR {project.budgetActual.toLocaleString()} / {project.budgetEstimate.toLocaleString()}</span>
                </div>
                <ProgressBar
                  value={budgetPercent}
                  height={4}
                  color={budgetPercent > 90 ? 'oklch(0.63 0.22 25)' : undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-border/15 select-none">
              <div className="p-2.5 bg-accent/15 border border-border/20 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-mono">Start Date</span>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="p-2.5 bg-accent/15 border border-border/20 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-mono">Target Date</span>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="p-2.5 bg-accent/15 border border-border/20 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-mono">Budget Limit</span>
                <p className="text-[13px] font-bold text-foreground mt-0.5 text-financial font-mono">LKR {(project.budgetEstimate / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-2.5 bg-accent/15 border border-border/20 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-mono">Expenses Logged</span>
                <p className="text-[13px] font-bold text-foreground mt-0.5 text-financial font-mono">LKR {(project.budgetActual / 1000000).toFixed(1)}M</p>
              </div>
            </div>

            {/* Funding Status Sub-banner */}
            <div className="mt-4 pt-4 border-t border-border/15 grid grid-cols-1 sm:grid-cols-3 gap-3.5 select-none text-left">
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 font-mono">Funding Received (Advances)</span>
                <p className="text-[15px] font-black text-indigo-400 mt-1 font-mono leading-none">
                  LKR {(project.totalAdvance || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-danger-subtle/10 border border-danger/15 rounded-xl">
                <span className="text-[9px] font-bold uppercase tracking-widest text-danger font-mono font-semibold">Funding Consumed</span>
                <p className="text-[15px] font-black text-danger mt-1 font-mono leading-none">
                  LKR {(project.totalSpent || 0).toLocaleString()}
                </p>
              </div>
              <div className={cn(
                'p-3 border rounded-xl',
                (project.remainingAdvance || 0) >= 0 
                  ? 'bg-success-subtle/10 border-success/15' 
                  : 'bg-danger-subtle/10 border-danger/15'
              )}>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono">Funding Remaining</span>
                <p className={cn(
                  'text-[15px] font-black mt-1 font-mono leading-none',
                  (project.remainingAdvance || 0) >= 0 ? 'text-success' : 'text-danger'
                )}>
                  LKR {(project.remainingAdvance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stakeholders & Client */}
        <Card className="glass-panel border-border/30 shadow-panel">
          <CardContent className="p-5 space-y-4 font-semibold text-left">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">Contact & Crew</h3>
            
            <div className="p-3 bg-accent/20 rounded-xl space-y-2 border border-border/25">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5 select-none font-mono">
                <User className="w-3.5 h-3.5 text-muted-foreground/75" />
                Client details
              </div>
              <div className="font-bold text-[15px] text-foreground">{project.clientName || 'N/A'}</div>
              {(project.clientPhone || project.clientEmail) && (
                <div className="space-y-1 text-[13px] text-muted-foreground/75 border-t border-border/15 pt-2 mt-1 font-medium font-mono select-none">
                  {project.clientPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground/45" />
                      <span>{project.clientPhone}</span>
                    </div>
                  )}
                  {project.clientEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/45" />
                      <span>{project.clientEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 select-none font-mono">Assigned Site Crew</span>
              <div className="space-y-1 pr-1 max-h-[120px] overflow-y-auto scrollbar-thin">
                {project.members.length > 0 ? project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-[13px] p-2 bg-accent/15 border border-border/20 rounded-xl font-bold">
                    <span className="text-foreground/80">
                      {member.user.firstName} {member.user.lastName}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-card text-muted-foreground uppercase border border-border/15 tracking-wider font-mono">
                      {member.projectRole}
                    </span>
                  </div>
                )) : (
                  <p className="text-[13px] italic text-center py-2 text-muted-foreground font-normal">No crew assigned</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Segmented View Tabs ═══ */}
      <div className="flex items-center bg-accent/25 p-1 rounded-xl border border-border/25 overflow-x-auto gap-1 select-none">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'boq', label: 'BOQ Estimates', icon: FileSpreadsheet },
          { id: 'tasks', label: `Tasks (${project._count.tasks})`, icon: CheckSquare },
          { id: 'logs', label: `Daily Logs (${project._count.dailyReports})`, icon: FileSpreadsheet },
          { id: 'expenses', label: 'Expenses Ledger', icon: Landmark }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* ═══ Tab Panel Content ═══ */}
      <div className="pt-1">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 glass-panel border-border/30">
              <CardContent className="p-5 space-y-4 font-semibold text-left">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 text-left select-none">Location & Geotags</h3>
                <div className="flex items-start gap-2.5 text-[15px]">
                  <MapPin className="w-4.5 h-4.5 text-muted-foreground/45 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-foreground">{project.location || 'Colombo, Sri Lanka'}</div>
                    <span className="text-[11px] text-muted-foreground/60 font-semibold font-mono">Geocoded Coordinates: 6.9107° N, 79.8612° E</span>
                  </div>
                </div>
                <div className="aspect-video bg-accent/10 rounded-xl overflow-hidden relative flex items-center justify-center border border-border/25 select-none">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground/5 via-transparent to-transparent opacity-60" />
                  <span className="text-[10px] text-muted-foreground/50 font-bold z-10 uppercase tracking-wider font-mono">Map View Interface Connected</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="glass-panel border-border/30">
                <CardContent className="p-5 font-semibold">
                  {chartData.length > 0 ? (
                    <DonutChart data={chartData} title="Capital Allocation" subtitle="Spent" />
                  ) : (
                    <div className="py-12 text-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider select-none font-mono">
                      No expenses logged yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/30">
                <CardContent className="p-5 space-y-4 font-semibold text-left">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">Operational Logs</h3>
                  <div className="grid grid-cols-2 gap-3.5 select-none">
                    <div className="p-3 bg-accent/15 border border-border/20 rounded-xl text-left font-mono">
                      <div className="text-[20px] font-semibold text-foreground/90">{project._count.tasks}</div>
                      <div className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider mt-0.5">Tasks Scheduled</div>
                    </div>
                    <div className="p-3 bg-accent/15 border border-border/20 rounded-xl text-left font-mono">
                      <div className="text-[20px] font-semibold text-foreground/90">{project._count.dailyReports}</div>
                      <div className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider mt-0.5">Daily Logs Filed</div>
                    </div>
                  </div>
                  <div className="text-[13px] text-muted-foreground/75 p-3 bg-accent/20 border border-border/20 rounded-xl flex gap-2 leading-relaxed font-semibold text-left select-none">
                    <AlertCircle className="w-4 h-4 text-muted-foreground/65 flex-shrink-0 mt-0.5" />
                    <p>Subcontractors and crews must update task timelines daily before site checks.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'boq' && (
          <BOQTab projectId={project.id} />
        )}

        {activeTab === 'tasks' && (
          <Card className="glass-panel border-border/30 shadow-panel text-left">
            <CardContent className="p-5 font-semibold">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-4 select-none">Site Task Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] text-left">
                  <thead>
                    <tr className="border-b border-border/25 text-muted-foreground/50 font-semibold uppercase tracking-wider text-[11px] select-none font-mono">
                      <th className="pb-2.5 pl-2 font-bold">Task Detail</th>
                      <th className="pb-2.5 font-bold">Status</th>
                      <th className="pb-2.5 font-bold">Priority</th>
                      <th className="pb-2.5 font-bold">Assignee</th>
                      <th className="pb-2.5 pr-2 font-bold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isTasksLoading ? (
                      <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                    ) : tasksList.length > 0 ? tasksList.map((task: any) => (
                      <tr key={task.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors font-bold">
                        <td className="py-3 pl-2 text-foreground">{task.title}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase font-mono ${
                            task.status === 'COMPLETED' ? 'bg-success-subtle/10 border border-success/25 text-success' :
                            task.status === 'IN_PROGRESS' ? 'bg-warning-subtle/10 border border-warning/25 text-warning' :
                            'bg-accent/40 border border-border/25 text-muted-foreground'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                            task.priority === 'URGENT' ? 'text-danger' :
                            task.priority === 'HIGH' ? 'text-warning' :
                            'text-muted-foreground/75'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground/80 font-semibold">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</td>
                        <td className="py-3 pr-2 text-muted-foreground/80 font-mono font-semibold">{new Date(task.dueDate).toLocaleDateString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground italic text-[15px] font-normal">No tasks registered in this workspace yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            {isLogsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : dailyLogsList.length > 0 ? dailyLogsList.map((log: any) => (
              <Card key={log.id} className="glass-panel border-border/30 text-left">
                <CardContent className="p-4 space-y-2.5 font-semibold">
                  <div className="flex items-center justify-between text-[13px] border-b border-border/15 pb-2.5 select-none">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground/45" />
                      Daily Site Log - {new Date(log.reportDate).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider font-mono">{log.weatherCondition || 'Sunny'} • {log.workersOnSite || 0} active crew</span>
                  </div>
                  <p className="text-[15px] text-foreground/80 leading-relaxed">{log.workSummary}</p>
                  <div className="text-[10px] text-muted-foreground/50 flex items-center gap-1.5 border-t border-border/15 pt-2 font-bold uppercase tracking-wider select-none font-mono">
                    <span>Logged by: <strong className="text-foreground/85">{log.reporter?.firstName} {log.reporter?.lastName}</strong></span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="py-12 text-center text-muted-foreground/65 text-[13px] font-bold uppercase tracking-wider glass-panel border-border/30 rounded-xl select-none font-mono">
                No daily logs have been submitted.
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <Card className="glass-panel border-border/30 shadow-panel text-left">
            <CardContent className="p-5 font-semibold">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-4 select-none">Financial Log Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] text-left">
                  <thead>
                    <tr className="border-b border-border/25 text-muted-foreground/50 font-semibold uppercase tracking-wider text-[11px] select-none font-mono">
                      <th className="pb-2.5 pl-2 font-bold">Item Description</th>
                      <th className="pb-2.5 font-bold">Allocation Category</th>
                      <th className="pb-2.5 font-bold">Amount (LKR)</th>
                      <th className="pb-2.5 font-bold">Logged Date</th>
                      <th className="pb-2.5 pr-2 font-bold">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isPurchasesLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td>
                      </tr>
                    ) : (projectPurchases || []).map((exp) => {
                      const allocation = exp.allocations?.find((a: any) => a.projectId === id);
                      const amount = allocation ? Number(allocation.amount) : Number(exp.totalAmount);
                      
                      return (
                        <tr key={exp.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors font-bold">
                          <td className="py-3 pl-2">
                            <div>
                              <div className="font-bold text-foreground">{exp.title}</div>
                              <span className="text-[10px] text-muted-foreground/60 font-semibold font-mono">By {exp.purchasedBy?.firstName} {exp.purchasedBy?.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground/75 font-bold uppercase tracking-wider text-[10px] font-mono">{catLabel[exp.category] || exp.category}</td>
                          <td className="py-3 font-bold text-foreground text-financial font-mono">LKR {amount.toLocaleString()}</td>
                          <td className="py-3 text-muted-foreground/80 font-semibold font-mono">{new Date(exp.purchaseDate).toLocaleDateString()}</td>
                          <td className="py-3 pr-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-success-subtle/10 border border-success/25 text-success tracking-wider uppercase font-mono select-none">
                              APPROVED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!isPurchasesLoading && (!projectPurchases || projectPurchases.length === 0)) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground italic text-[15px] font-normal">
                          No budget expenses recorded in this ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
