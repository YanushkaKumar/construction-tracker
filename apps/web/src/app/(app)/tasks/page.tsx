'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckSquare, 
  Calendar, 
  User, 
  AlertCircle, 
  Loader2, 
  Plus, 
  KanbanSquare, 
  ListTodo, 
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Project {
  id: string;
  name: string;
  code: string;
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeView, setActiveView] = useState<'my-tasks' | 'kanban'>('my-tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Fetch user projects for the kanban filter
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data;
    },
    retry: 1,
  });

  // Fetch tasks assigned to current user
  const { data: myTasksData, isLoading: isMyTasksLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks/my-tasks');
      return response.data;
    },
    enabled: activeView === 'my-tasks',
    retry: 1,
  });

  // Fetch project-specific tasks for Kanban board
  const { data: projectTasksData, isLoading: isKanbanLoading } = useQuery<Task[]>({
    queryKey: ['project-tasks', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL' || selectedProjectId === '') return [];
      const response = await apiClient.get(`/projects/${selectedProjectId}/tasks`);
      return response.data;
    },
    enabled: activeView === 'kanban' && selectedProjectId !== 'ALL',
    retry: 1,
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiClient.patch(`/tasks/${taskId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-rose-500 bg-rose-500/10';
      case 'HIGH': return 'text-amber-500 bg-amber-500/10';
      case 'MEDIUM': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-zinc-500 bg-zinc-500/10';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'IN_REVIEW': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    }
  };

  // Mock Fallbacks for offline review
  const mockMyTasks: Task[] = [
    {
      id: 'task1',
      projectId: 'prj1',
      title: 'Complete 8th floor slab casting',
      description: 'Supervise concrete pouring and inspect structural reinforcement steel bars.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-07-15',
      project: { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' }
    },
    {
      id: 'task2',
      projectId: 'prj1',
      title: 'Install MEP ducting (floors 1-5)',
      description: 'Coordinate with subcontractor team for mechanical duct installations.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '2026-08-01',
      project: { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' }
    }
  ];

  const mockProjectTasks: Task[] = [
    { id: 't1', projectId: 'prj1', title: 'Complete 8th floor slab casting', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2026-07-15', assignee: { id: 'eng', firstName: 'Kasun', lastName: 'Silva' } },
    { id: 't2', projectId: 'prj1', title: 'Install MEP ducting (floors 1-5)', status: 'TODO', priority: 'MEDIUM', dueDate: '2026-08-01', assignee: { id: 'eng', firstName: 'Kasun', lastName: 'Silva' } },
    { id: 't3', projectId: 'prj1', title: 'Plumbing rough-in (6th floor)', status: 'COMPLETED', priority: 'HIGH', dueDate: '2026-06-20', assignee: { id: 'eng', firstName: 'Kasun', lastName: 'Silva' } },
    { id: 't4', projectId: 'prj1', title: 'Order steel reinforcement (phase 3)', status: 'TODO', priority: 'URGENT', dueDate: '2026-06-28' },
  ];

  const activeMyTasks = myTasksData || mockMyTasks;
  const activeProjectTasks = (selectedProjectId === 'ALL' || selectedProjectId === '') ? mockProjectTasks : (projectTasksData || mockProjectTasks);
  const projectsList = projectsData?.data || [
    { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' },
    { id: 'prj2', name: 'Palm Villa - Negombo', code: 'PRJ-002' }
  ];

  // Group tasks by status for Kanban Board
  const kanbanColumns = {
    TODO: activeProjectTasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: activeProjectTasks.filter(t => t.status === 'IN_PROGRESS'),
    IN_REVIEW: activeProjectTasks.filter(t => t.status === 'IN_REVIEW'),
    COMPLETED: activeProjectTasks.filter(t => t.status === 'COMPLETED'),
    BLOCKED: activeProjectTasks.filter(t => t.status === 'BLOCKED'),
  };

  return (
    <div className="space-y-6">
      {/* Header and navigation tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Site Tasks
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Allocate task schedules, track status, and coordinate site operations.
          </p>
        </div>

        {/* View toggle buttons */}
        <div className="flex gap-2">
          <Button 
            variant={activeView === 'my-tasks' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setActiveView('my-tasks')}
            className={`text-xs rounded-lg ${activeView === 'my-tasks' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950' : 'border-zinc-200 dark:border-zinc-800'}`}
          >
            <ListTodo className="w-4 h-4 mr-2" />
            My Tasks
          </Button>
          <Button 
            variant={activeView === 'kanban' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => {
              setActiveView('kanban');
              if (selectedProjectId === 'ALL' && projectsList.length > 0) {
                setSelectedProjectId(projectsList[0].id);
              }
            }}
            className={`text-xs rounded-lg ${activeView === 'kanban' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950' : 'border-zinc-200 dark:border-zinc-800'}`}
          >
            <KanbanSquare className="w-4 h-4 mr-2" />
            Kanban Board
          </Button>
        </div>
      </div>

      {/* Sub-panels */}
      {activeView === 'my-tasks' ? (
        <div className="space-y-4">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Tasks Assigned to Me</CardTitle>
              <CardDescription>Uncompleted schedules requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isMyTasksLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : activeMyTasks.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No tasks currently assigned to you.</p>
              ) : (
                <div className="space-y-4">
                  {activeMyTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-500/20 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">
                            {task.project?.code} • {task.project?.name}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-zinc-500 line-clamp-1">{task.description}</p>
                        )}
                        {task.dueDate && (
                          <span className="inline-flex items-center text-[10px] text-zinc-400 font-semibold gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Dropdown status update for ease of update */}
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Label htmlFor={`status-${task.id}`} className="sr-only">Status</Label>
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          disabled={updateStatusMutation.isPending}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="w-full sm:w-36 h-9 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Kanban controls: project filter */}
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <Label htmlFor="projectSelect" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Project</Label>
            <select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="max-w-xs h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="ALL">All Demo Tasks</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {isKanbanLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            /* Kanban Columns Wrapper */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {/* Columns mapping */}
              {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map((colKey) => {
                const columnTasks = kanbanColumns[colKey];
                return (
                  <div key={colKey} className="flex flex-col min-w-[220px] bg-zinc-100/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-3 min-h-[500px]">
                    <div className="flex items-center justify-between gap-2 mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        {colKey.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnTasks.map((task) => (
                        <Card key={task.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2">
                              {task.title}
                            </h5>
                            
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-500">
                              {task.assignee ? (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-amber-500" />
                                  {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
                                </span>
                              ) : (
                                <span className="text-zinc-400 italic">Unassigned</span>
                              )}
                              
                              {task.dueDate && (
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3 text-zinc-400" />
                                  {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                            {/* Dropdown in Card for instant status shifting */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="w-full h-8 mt-2 rounded border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-1.5 py-0.5 text-[10px] focus:outline-none"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="IN_REVIEW">In Review</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="BLOCKED">Blocked</option>
                            </select>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
