'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Package, 
  Landmark, 
  Users, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

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

  const mockTasks = [
    { title: 'Complete 8th floor slab casting', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Kasun Silva', dueDate: '2026-07-15' },
    { title: 'Install MEP ducting (floors 1-5)', status: 'TODO', priority: 'MEDIUM', assignee: 'Kasun Silva', dueDate: '2026-08-01' },
    { title: 'Plumbing rough-in (6th floor)', status: 'COMPLETED', priority: 'HIGH', assignee: 'Kasun Silva', dueDate: '2026-06-20' },
    { title: 'Order steel reinforcement (phase 3)', status: 'TODO', priority: 'URGENT', assignee: 'Unassigned', dueDate: '2026-06-28' },
  ];

  const mockDailyLogs = [
    { date: '2026-06-22', weather: 'Sunny', reporter: 'Kasun Silva', summary: 'Casting of 8th floor columns completed. Brick laying in progress on 4th floor.', workers: 14 },
    { date: '2026-06-21', weather: 'Rainy (Heavy)', reporter: 'Kasun Silva', summary: 'Due to monsoon rains, concrete casting delayed. Indoor plastering continued on floors 2-3.', workers: 8 },
  ];

  const mockExpenses = [
    { title: 'Cement purchase - 200 bags', category: 'MATERIAL', amount: 370000, date: '2026-06-15', status: 'APPROVED', submitter: 'Kasun Silva' },
    { title: 'Overtime wages - week 24', category: 'LABOUR', amount: 85000, date: '2026-06-20', status: 'PENDING', submitter: 'Kasun Silva' },
    { title: 'Concrete mixer rental - June', category: 'EQUIPMENT', amount: 120000, date: '2026-06-01', status: 'APPROVED', submitter: 'Nimal Fernando' },
  ];

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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
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
        <Card className="border-zinc-200 dark:border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Project Summary</CardTitle>
            <CardDescription>{project.description || 'No description provided.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">Construction Progress</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{project.progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${project.progressPercent}%` }} />
                </div>
              </div>

              {/* Budget utilization */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">Financial Budget Spent</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{budgetPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(budgetPercent, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Start Date</div>
                <div className="text-sm font-semibold mt-0.5">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target Completion</div>
                <div className="text-sm font-semibold mt-0.5">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Budget Limit</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">LKR {(project.budgetEstimate / 1000000).toFixed(1)}M</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Expenses Logged</div>
                <div className="text-sm font-bold text-amber-500 mt-0.5">LKR {(project.budgetActual / 1000000).toFixed(1)}M</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & Assigned team */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Contact & Stakeholders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client card */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-900">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
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
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Site Crew</div>
              <div className="space-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {member.user.firstName} {member.user.lastName}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
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

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base">Location & Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{project.location || 'Colombo, Sri Lanka'}</div>
                    <span className="text-xs text-zinc-400">Coordinates: 6.9107° N, 79.8612° E</span>
                  </div>
                </div>
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                  {/* Decorative Map Grid placeholder */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-100/10 to-transparent opacity-60" />
                  <span className="text-xs text-zinc-400 font-medium z-10">Map View (Coordinates Configured)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base">Quick Logs Summary</CardTitle>
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
        )}

        {activeTab === 'tasks' && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Task Schedule</CardTitle>
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
                    {mockTasks.map((task, i) => (
                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{task.title}</td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
                            task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30' :
                            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold ${
                            task.priority === 'URGENT' ? 'text-rose-500' :
                            task.priority === 'HIGH' ? 'text-amber-500' :
                            'text-zinc-400'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-500">{task.assignee}</td>
                        <td className="py-3.5 text-zinc-500">{new Date(task.dueDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {mockDailyLogs.map((log, i) => (
              <Card key={i} className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                      Daily Log - {new Date(log.date).toLocaleDateString()}
                    </span>
                    <span className="text-zinc-400">{log.weather} • {log.workers} workers on site</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{log.summary}</p>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 border-t border-zinc-100 dark:border-zinc-900 pt-2">
                    <span>Filed by: <strong className="text-zinc-600 dark:text-zinc-400">{log.reporter}</strong></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'expenses' && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Ledger & Financials</CardTitle>
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
                    {mockExpenses.map((exp, i) => (
                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-3.5">
                          <div>
                            <div className="font-medium text-zinc-800 dark:text-zinc-200">{exp.title}</div>
                            <span className="text-[10px] text-zinc-400">By {exp.submitter}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-zinc-500 text-xs">{exp.category}</td>
                        <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-200">LKR {exp.amount.toLocaleString()}</td>
                        <td className="py-3.5 text-zinc-500 text-xs">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            exp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30'
                          }`}>
                            {exp.status}
                          </span>
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
    </div>
  );
}
