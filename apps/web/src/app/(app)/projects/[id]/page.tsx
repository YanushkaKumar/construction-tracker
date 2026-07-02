'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, MapPin, User, Calendar, ArrowLeft, Phone, Mail, 
  Plus, Loader2, CheckSquare, FileSpreadsheet, Landmark, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BOQTab } from './components/BOQTab';
import { DonutChart, ProgressBar } from '@/components/ui/custom-charts';

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

  const { data, isLoading, error } = useQuery<ProjectDetails>({
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

  const project = data;

  if (isLoading || !project) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-caption">Loading project workspace…</span>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* ═══ Header/Navigation ═══ */}
      <div className="space-y-3">
        <Link href="/projects" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-label text-muted-foreground/50">{project.code}</span>
              <div className="flex items-center gap-1.5">
                <span className={`status-dot ${meta.dotClass}`} />
                <span className="text-[10px] font-medium text-muted-foreground">{meta.label}</span>
              </div>
            </div>
            <h1 className="text-display text-foreground">{project.name}</h1>
          </div>
        </div>
      </div>

      {/* ═══ Overview Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Summary */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-label text-muted-foreground/60 mb-2">Project Summary</h3>
              <p className="text-xs text-foreground/80 leading-relaxed">{project.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <ProgressBar value={project.progressPercent} label="Construction Progress" showLabel height={4} />
              <ProgressBar
                value={budgetPercent}
                label="Financial Budget Spent"
                showLabel
                height={4}
                color={budgetPercent > 90 ? 'oklch(0.63 0.22 25)' : undefined}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border/40">
              <div>
                <span className="text-label text-muted-foreground/50 text-[9px]">Start Date</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <span className="text-label text-muted-foreground/50 text-[9px]">Completion Target</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <span className="text-label text-muted-foreground/50 text-[9px]">Budget Limit</span>
                <p className="text-xs font-semibold text-foreground mt-0.5 text-financial">LKR {(project.budgetEstimate / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <span className="text-label text-muted-foreground/50 text-[9px]">Expenses Logged</span>
                <p className="text-xs font-semibold text-foreground mt-0.5 text-financial">LKR {(project.budgetActual / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stakeholders & Client */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-label text-muted-foreground/60">Contact & Stakeholders</h3>
            
            <div className="p-3.5 bg-accent/40 rounded-xl space-y-2 border border-border/30">
              <div className="text-label text-muted-foreground/50 text-[9px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground/75" />
                Client details
              </div>
              <div className="font-semibold text-xs text-foreground">{project.clientName || 'N/A'}</div>
              {(project.clientPhone || project.clientEmail) && (
                <div className="space-y-1 text-[10px] text-muted-foreground/70 border-t border-border/30 pt-2 mt-1">
                  {project.clientPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground/40" />
                      <span>{project.clientPhone}</span>
                    </div>
                  )}
                  {project.clientEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-muted-foreground/40" />
                      <span>{project.clientEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-label text-muted-foreground/50 text-[9px]">Assigned Site Crew</span>
              <div className="space-y-1.5">
                {project.members.length > 0 ? project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs p-2 bg-accent/30 rounded-lg">
                    <span className="font-medium text-foreground/80">
                      {member.user.firstName} {member.user.lastName}
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-card text-muted-foreground uppercase border border-border/20">
                      {member.projectRole}
                    </span>
                  </div>
                )) : (
                  <p className="text-caption text-center py-2">No site crew assigned</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Segmented View Tabs ═══ */}
      <div className="flex items-center bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1">
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

      {/* ═══ Tab Panel Content ═══ */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-label text-muted-foreground/60">Location & Mapping</h3>
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">{project.location || 'Colombo, Sri Lanka'}</div>
                    <span className="text-caption">Coordinates: 6.9107° N, 79.8612° E</span>
                  </div>
                </div>
                <div className="aspect-video bg-accent/10 rounded-xl overflow-hidden relative flex items-center justify-center border border-border/40">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground/5 via-transparent to-transparent opacity-60" />
                  <span className="text-[10px] text-muted-foreground/50 font-semibold z-10 uppercase tracking-wider">Map View Interface</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-label text-muted-foreground/60 mb-5">Expense Breakdown</h3>
                  {chartData.length > 0 ? (
                    <DonutChart data={chartData} subtitle="Spent" />
                  ) : (
                    <div className="py-12 text-center text-caption uppercase">
                      No expenses logged yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-label text-muted-foreground/60">Logs Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-accent/30 rounded-xl border border-border/30">
                      <div className="text-xl font-bold text-foreground text-financial">{project._count.tasks}</div>
                      <div className="text-[9px] text-muted-foreground/50 font-bold uppercase mt-0.5">Tasks Scheduled</div>
                    </div>
                    <div className="p-3.5 bg-accent/30 rounded-xl border border-border/30">
                      <div className="text-xl font-bold text-foreground text-financial">{project._count.dailyReports}</div>
                      <div className="text-[9px] text-muted-foreground/50 font-bold uppercase mt-0.5">Logs Filed</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 p-3.5 bg-accent/40 border border-border/40 rounded-xl flex gap-2 leading-relaxed">
                    <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                    <p>Site engineers must log worker registers daily by 5:00 PM for audit purposes.</p>
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
          <Card>
            <CardContent className="p-6">
              <h3 className="text-label text-muted-foreground/60 mb-4">Task Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Task Detail</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Priority</th>
                      <th className="pb-3 font-semibold">Assignee</th>
                      <th className="pb-3 font-semibold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isTasksLoading ? (
                      <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                    ) : tasksList.length > 0 ? tasksList.map((task: any) => (
                      <tr key={task.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 font-medium text-foreground">{task.title}</td>
                        <td className="py-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            task.status === 'COMPLETED' ? 'bg-success-subtle text-success' :
                            task.status === 'IN_PROGRESS' ? 'bg-warning-subtle text-warning' :
                            'bg-accent text-muted-foreground'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            task.priority === 'URGENT' ? 'text-danger' :
                            task.priority === 'HIGH' ? 'text-warning' :
                            'text-muted-foreground'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 text-muted-foreground font-medium">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</td>
                        <td className="py-3.5 text-muted-foreground font-medium">{new Date(task.dueDate).toLocaleDateString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-xs italic">No tasks assigned yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {isLogsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : dailyLogsList.length > 0 ? dailyLogsList.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-border/30 pb-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground/60" />
                      Daily Site Log - {new Date(log.reportDate).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">{log.weatherCondition || 'Sunny'} • {log.workersOnSite || 0} crew on site</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium">{log.workSummary}</p>
                  <div className="text-[9px] text-muted-foreground/50 flex items-center gap-1.5 border-t border-border/20 pt-2 font-bold uppercase tracking-wider">
                    <span>Logged by: <strong className="text-foreground/80 font-semibold">{log.reporter?.firstName} {log.reporter?.lastName}</strong></span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="py-12 text-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                No daily logs have been submitted yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-label text-muted-foreground/60 mb-4">Ledger & Financials</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Title</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Amount (LKR)</th>
                      <th className="pb-3 font-semibold">Logged Date</th>
                      <th className="pb-3 font-semibold">Approval</th>
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
                        <tr key={exp.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                          <td className="py-3.5">
                            <div className="text-left">
                              <div className="font-semibold text-foreground">{exp.title}</div>
                              <span className="text-[10px] text-muted-foreground/50 font-medium">By {exp.purchasedBy?.firstName} {exp.purchasedBy?.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{catLabel[exp.category] || exp.category}</td>
                          <td className="py-3.5 font-bold text-foreground text-financial">LKR {amount.toLocaleString()}</td>
                          <td className="py-3.5 text-muted-foreground font-medium">{new Date(exp.purchaseDate).toLocaleDateString()}</td>
                          <td className="py-3.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-success-subtle text-success tracking-wider uppercase">
                              APPROVED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!isPurchasesLoading && (!projectPurchases || projectPurchases.length === 0)) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs italic">
                          No expenses recorded yet.
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
