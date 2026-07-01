'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  User, 
  Calendar, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Plus, 
  Loader2, 
  CheckSquare, 
  FileSpreadsheet, 
  Landmark, 
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BOQTab } from './components/BOQTab';
import { DonutChart } from '@/components/ui/custom-charts';

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

  // Fetch real project purchases
  const { data: projectPurchases, isLoading: isPurchasesLoading } = useQuery<any[]>({
    queryKey: ['project-purchases', id],
    queryFn: async () => (await apiClient.get(`/purchases?projectId=${id}`)).data,
    retry: 1,
  });

  // Fetch real tasks
  const { data: projectTasks, isLoading: isTasksLoading } = useQuery<any[]>({
    queryKey: ['project-tasks', id],
    queryFn: async () => (await apiClient.get(`/projects/${id}/tasks`)).data,
    retry: 1,
  });

  // Fetch real daily logs
  const { data: projectLogsData, isLoading: isLogsLoading } = useQuery<{ data: any[] }>({
    queryKey: ['project-daily-logs', id],
    queryFn: async () => (await apiClient.get(`/projects/${id}/daily-reports`)).data,
    retry: 1,
  });

  // Mock project details matching seed data in case API is offline
  const mockProjectDetails: Record<string, ProjectDetails> = {
    'prj1': {
      id: 'prj1',
      name: 'Horizon Tower - Colombo 07',
      code: 'PRJ-001',
      description: '12-story residential apartment complex in Colombo 07',
      clientName: 'Mr. Amal Rajapaksa',
      clientPhone: '+94777654321',
      clientEmail: 'amal@rajapaksa.lk',
      location: 'Colombo 07',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      budgetEstimate: 150000000,
      budgetActual: 85000000,
      progressPercent: 58,
      startDate: '2025-06-01',
      endDate: '2027-06-01',
      members: [
        { id: 'm1', projectRole: 'Project Manager', user: { id: 'pm', firstName: 'Nimal', lastName: 'Fernando', email: 'pm@lankabuild.lk' } },
        { id: 'm2', projectRole: 'Site Engineer', user: { id: 'eng', firstName: 'Kasun', lastName: 'Silva', email: 'engineer@lankabuild.lk' } },
        { id: 'm3', projectRole: 'Quantity Surveyor', user: { id: 'qs', firstName: 'Dilshan', lastName: 'Jayasuriya', email: 'qs@lankabuild.lk' } }
      ],
      _count: { tasks: 4, expenses: 3, dailyReports: 8, attendance: 24 }
    },
    'prj2': {
      id: 'prj2',
      name: 'Palm Villa - Negombo',
      code: 'PRJ-002',
      description: 'Luxury 3-bedroom villa with pool in Negombo',
      clientName: 'Mrs. Kumari Bandara',
      clientPhone: '+94778765432',
      clientEmail: 'kumari@villa.lk',
      location: 'Negombo',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      budgetEstimate: 45000000,
      budgetActual: 18000000,
      progressPercent: 35,
      startDate: '2026-01-15',
      endDate: '2026-12-31',
      members: [
        { id: 'm1', projectRole: 'Project Manager', user: { id: 'pm', firstName: 'Nimal', lastName: 'Fernando', email: 'pm@lankabuild.lk' } },
        { id: 'm2', projectRole: 'Site Engineer', user: { id: 'eng', firstName: 'Kasun', lastName: 'Silva', email: 'engineer@lankabuild.lk' } }
      ],
      _count: { tasks: 2, expenses: 1, dailyReports: 4, attendance: 12 }
    }
  };

  const project = data || mockProjectDetails[id] || mockProjectDetails['prj1'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  const budgetPercent = project.budgetEstimate > 0 
    ? Math.round((project.budgetActual / project.budgetEstimate) * 100)
    : 0;

  // Process real expenses by category for the chart
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
      PROJECT_MATERIAL: '#d97706',
      SHARED_TOOL: '#8b5cf6',
      DAILY_EXPENSE: '#f43f5e',
      SERVICE: '#06b6d4',
      TRANSPORT: '#ec4899',
      OTHER: '#6b7280',
    };
    return {
      label: catLabel[category] || category,
      value: total as number,
      color: categoryColors[category] || '#6b7280',
    };
  });

  const tasksList = projectTasks || [];
  const dailyLogsList = projectLogsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="space-y-3">
        <Link href="/projects" className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-amber-500 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-zinc-400">{project.code}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 flex items-center gap-3">
              {project.name}
            </h1>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Grid: Details Cards & Budget progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress & Budget utilisation */}
        <Card className="border-zinc-200 dark:border-zinc-800 lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Project Summary</CardTitle>
            <CardDescription>{project.description || 'No description provided.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-550 uppercase">Construction Progress</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{project.progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${project.progressPercent}%` }} />
                </div>
              </div>

              {/* Budget utilization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-550 uppercase">Financial Budget Spent</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{budgetPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(budgetPercent, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Date</div>
                <div className="text-sm font-semibold mt-0.5">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Completion</div>
                <div className="text-sm font-semibold mt-0.5">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Budget Limit</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">LKR {(project.budgetEstimate / 1000000).toFixed(1)}M</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Expenses Logged</div>
                <div className="text-sm font-bold text-amber-500 mt-0.5">LKR {(project.budgetActual / 1000000).toFixed(1)}M</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & Assigned team */}
        <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Contact & Stakeholders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client card */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-900">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                Client details
              </div>
              <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{project.clientName || 'N/A'}</div>
              <div className="space-y-1 text-xs text-zinc-500">
                {project.clientPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span>{project.clientPhone}</span>
                  </div>
                )}
                {project.clientEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span>{project.clientEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Team details */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assigned Site Crew</div>
              <div className="space-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">
                      {member.user.firstName} {member.user.lastName}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                      {member.projectRole}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs list */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2 pb-px">
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
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                isActive 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-500' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-zinc-200 dark:border-zinc-800 lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Location & Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">{project.location || 'Colombo, Sri Lanka'}</div>
                    <span className="text-xs text-zinc-400">Coordinates: 6.9107° N, 79.8612° E</span>
                  </div>
                </div>
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-100/10 to-transparent opacity-60" />
                  <span className="text-xs text-zinc-400 font-medium z-10">Map View (Coordinates Configured)</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Expense Breakdown</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  {chartData.length > 0 ? (
                    <DonutChart data={chartData} subtitle="Total Spent" />
                  ) : (
                    <div className="py-12 text-center text-zinc-400 text-xs italic">
                      No expenses logged for this project yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Quick Logs Summary</CardTitle>
                  <CardDescription>Key project status summaries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{project._count.tasks}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Tasks Scheduled</div>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{project._count.dailyReports}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Daily Logs Filed</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
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
          <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold">Task Schedule</CardTitle>
                <CardDescription>Scheduled actions for this construction site</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Task Detail</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Priority</th>
                      <th className="pb-3 font-semibold">Assignee</th>
                      <th className="pb-3 font-semibold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isTasksLoading ? (
                      <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400" /></td></tr>
                    ) : tasksList.length > 0 ? tasksList.map((task: any) => (
                      <tr key={task.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-200">{task.title}</td>
                        <td className="py-3.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
                            task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30' :
                            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`text-xs font-bold ${
                            task.priority === 'URGENT' ? 'text-rose-500' :
                            task.priority === 'HIGH' ? 'text-amber-500' :
                            'text-zinc-400'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-500 font-semibold">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</td>
                        <td className="py-3.5 text-zinc-500 font-medium">{new Date(task.dueDate).toLocaleDateString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="py-8 text-center text-zinc-400 text-xs italic">No tasks assigned yet.</td></tr>
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
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : dailyLogsList.length > 0 ? dailyLogsList.map((log: any) => (
              <Card key={log.id} className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                      Daily Log - {new Date(log.reportDate).toLocaleDateString()}
                    </span>
                    <span className="text-zinc-500 font-semibold">{log.weatherCondition || 'Sunny'} • {log.workersOnSite || 0} workers on site</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">{log.workSummary}</p>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 border-t border-zinc-100 dark:border-zinc-900 pt-2 font-bold uppercase tracking-wider">
                    <span>Filed by: <strong className="text-zinc-600 dark:text-zinc-400">{log.reporter?.firstName} {log.reporter?.lastName}</strong></span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No daily logs have been submitted for this project yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Ledger & Financials</CardTitle>
              <CardDescription>Logged purchase orders and workforce wages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
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
                        <td colSpan={5} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400" /></td>
                      </tr>
                    ) : (projectPurchases || []).map((exp) => {
                      const allocation = exp.allocations?.find((a: any) => a.projectId === id);
                      const amount = allocation ? Number(allocation.amount) : Number(exp.totalAmount);
                      
                      return (
                        <tr key={exp.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="py-3.5">
                            <div>
                              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{exp.title}</div>
                              <span className="text-xs text-zinc-500 font-medium">By {exp.purchasedBy?.firstName} {exp.purchasedBy?.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-zinc-500 text-xs font-semibold uppercase">{catLabel[exp.category] || exp.category}</td>
                          <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-200">LKR {amount.toLocaleString()}</td>
                          <td className="py-3.5 text-zinc-500 text-xs font-medium">{new Date(exp.purchaseDate).toLocaleDateString()}</td>
                          <td className="py-3.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500">
                              APPROVED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!isPurchasesLoading && (!projectPurchases || projectPurchases.length === 0)) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400 text-xs italic">
                          No expenses recorded yet for this project.
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
