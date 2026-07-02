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
  Pencil,
  Trash2,
  X,
  Tag,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ── Types ────────────────────────────────────────────

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
  assignee?: { id: string; firstName: string; lastName: string; avatar?: string | null };
  project?: { id: string; name: string; code: string };
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

interface CompanyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ── Helpers ──────────────────────────────────────────

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'URGENT': return 'text-rose-500 bg-rose-500/10';
    case 'HIGH': return 'text-amber-500 bg-amber-500/10';
    case 'MEDIUM': return 'text-blue-500 bg-blue-500/10';
    default: return 'text-zinc-500 bg-zinc-500/10';
  }
};

const getStatusBadge = (s: string) => {
  switch (s) {
    case 'TODO': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
    case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'IN_REVIEW': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    default: return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
  }
};

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

// ── Task Form Component ──────────────────────────────

function TaskForm({
  projects,
  users,
  initial,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: {
  projects: Project[];
  users: CompanyUser[];
  initial?: Partial<Task>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const [projectId, setProjectId] = useState(initial?.projectId || (projects[0]?.id ?? ''));
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState(initial?.priority || 'MEDIUM');
  const [status, setStatus] = useState(initial?.status || 'TODO');
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.split('T')[0] : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectId,
      title,
      description: description || undefined,
      priority,
      status,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project (only for create, not edit) */}
      {!initial?.id && (
        <div className="space-y-1.5">
          <Label htmlFor="taskProject" className="text-xs font-bold uppercase text-zinc-500">Project *</Label>
          <select
            id="taskProject"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="" disabled>Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="taskTitle" className="text-xs font-bold uppercase text-zinc-500">Title *</Label>
        <Input
          id="taskTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Complete 8th floor slab casting"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="taskDesc" className="text-xs font-bold uppercase text-zinc-500">Description</Label>
        <textarea
          id="taskDesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional task details..."
          rows={3}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="taskPriority" className="text-xs font-bold uppercase text-zinc-500">Priority</Label>
          <select
            id="taskPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taskStatus" className="text-xs font-bold uppercase text-zinc-500">Status</Label>
          <select
            id="taskStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="taskAssignee" className="text-xs font-bold uppercase text-zinc-500">Assignee</Label>
          <select
            id="taskAssignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taskDueDate" className="text-xs font-bold uppercase text-zinc-500">Due Date</Label>
          <Input
            id="taskDueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="text-xs">Cancel</Button>
        <Button type="submit" disabled={isLoading || !title || (!initial?.id && !projectId)} className="bg-amber-500 text-zinc-950 hover:bg-amber-600 text-xs font-semibold">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeView, setActiveView] = useState<'all-tasks' | 'kanban'>('all-tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Fetch projects
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });
  const projectsList = projectsData?.data || [];

  // Fetch company users for assignee dropdown
  const { data: usersData } = useQuery<{ data: CompanyUser[] }>({
    queryKey: ['company-users'],
    queryFn: async () => (await apiClient.get('/users')).data,
    retry: 1,
  });
  const usersList = usersData?.data || [];

  // Fetch all tasks (across all projects, for list view)
  const { data: allTasksData, isLoading: isAllTasksLoading } = useQuery<Task[]>({
    queryKey: ['all-tasks', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId) {
        return (await apiClient.get(`/projects/${selectedProjectId}/tasks`)).data;
      }
      // Fetch tasks across all projects
      const tasks: Task[] = [];
      for (const p of projectsList) {
        try {
          const res = await apiClient.get(`/projects/${p.id}/tasks`);
          const projectTasks = (res.data || []).map((t: any) => ({ ...t, project: { id: p.id, name: p.name, code: p.code } }));
          tasks.push(...projectTasks);
        } catch { /* skip failed projects */ }
      }
      return tasks;
    },
    enabled: activeView === 'all-tasks' && projectsList.length > 0,
    retry: 1,
  });

  // Fetch project tasks for Kanban
  const kanbanProjectId = selectedProjectId || projectsList[0]?.id || '';
  const { data: kanbanTasksData, isLoading: isKanbanLoading } = useQuery<Task[]>({
    queryKey: ['kanban-tasks', kanbanProjectId],
    queryFn: async () => {
      if (!kanbanProjectId) return [];
      return (await apiClient.get(`/projects/${kanbanProjectId}/tasks`)).data;
    },
    enabled: activeView === 'kanban' && !!kanbanProjectId,
    retry: 1,
  });

  // ── Mutations ────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { projectId, ...rest } = data;
      return (await apiClient.post(`/projects/${projectId}/tasks`, rest)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return (await apiClient.patch(`/tasks/${id}`, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/tasks/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingTask(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return (await apiClient.patch(`/tasks/${taskId}/status`, { status })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  // ── Data ─────────────────────────────────────────

  const allTasks = allTasksData || [];
  const kanbanTasks = kanbanTasksData || [];

  const kanbanColumns = {
    TODO: kanbanTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: kanbanTasks.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: kanbanTasks.filter((t) => t.status === 'IN_REVIEW'),
    COMPLETED: kanbanTasks.filter((t) => t.status === 'COMPLETED'),
    BLOCKED: kanbanTasks.filter((t) => t.status === 'BLOCKED'),
  };

  // ── Render ───────────────────────────────────────

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div className="text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-orange-500" />
            Site Tasks Scheduler
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Create, assign, schedule milestone check-ins, and track workflows across active construction sites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Segmented View Selector */}
          <div className="flex bg-zinc-100/50 dark:bg-zinc-800/40 p-1 rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 mr-2">
            <button
              onClick={() => setActiveView('all-tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                activeView === 'all-tasks'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border border-zinc-200/45 dark:border-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => {
                setActiveView('kanban');
                if (!selectedProjectId && projectsList.length > 0) setSelectedProjectId(projectsList[0].id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                activeView === 'kanban'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border border-zinc-200/45 dark:border-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Add Task button */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 border border-zinc-950 shadow-sm rounded-lg text-xs font-semibold px-4 py-2 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                <Plus className="w-4 h-4 mr-2 text-orange-500" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg glass-panel p-6">
              <DialogHeader className="text-left mb-4">
                <DialogTitle className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Create New Task</DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-medium font-medium">Add a task to one of your projects.</DialogDescription>
              </DialogHeader>
              <TaskForm
                projects={projectsList}
                users={usersList}
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setCreateOpen(false)}
                isLoading={createMutation.isPending}
                submitLabel="Create Task"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project filter (shared between views) */}
      <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-zinc-900/30 border border-zinc-200/40 dark:border-zinc-800/50 rounded-2xl shadow-sm glass-panel text-left">
        <Label htmlFor="projectFilter" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Filter by Project</Label>
        <select
          id="projectFilter"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="max-w-xs h-8 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs focus-visible:outline-none focus-visible:border-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="">All Projects</option>
          {projectsList.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>
      </div>

      {/* ── LIST VIEW ─────────────────────────────── */}
      {activeView === 'all-tasks' && (
        <Card className="glass-panel">
          <CardHeader className="border-b border-zinc-200/40 dark:border-zinc-800/40 text-left">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">All Active Tasks</CardTitle>
            <CardDescription className="text-zinc-500 mt-1">{allTasks.length} task{allTasks.length !== 1 ? 's' : ''} found</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 text-left">
            {isAllTasksLoading ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="h-32 rounded-xl bg-white/50 dark:bg-zinc-900/50 shimmer-bg" />
              </div>
            ) : allTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <CheckSquare className="w-8 h-8 text-zinc-400" />
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No tasks yet</p>
                <p className="text-[10px] text-zinc-400">Click &quot;Add Task&quot; to create your first task.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white/40 dark:bg-zinc-950/20 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
                  >
                    {/* Task Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          {task.project?.code || '—'} • {task.project?.name || 'Unknown'}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          task.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                          task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                          'bg-zinc-100 text-zinc-650 dark:bg-zinc-800/80 dark:text-zinc-450'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          task.status === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                          'bg-zinc-100 text-zinc-650 dark:bg-zinc-800/85 dark:text-zinc-450'
                        }`}>
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-zinc-850 dark:text-zinc-100 truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-zinc-450 dark:text-zinc-400 line-clamp-1 leading-relaxed font-medium">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-orange-500" />
                            {task.assignee.firstName} {task.assignee.lastName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1 font-medium text-zinc-400">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={task.status}
                        disabled={statusMutation.isPending}
                        onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                        className="w-28 h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-orange-500 hover:bg-zinc-550/5"
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-zinc-550/5"
                        onClick={() => setDeletingTask(task)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── KANBAN VIEW ───────────────────────────── */}
      {activeView === 'kanban' && (
        <div className="space-y-4 text-left">
          {isKanbanLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/50 dark:bg-zinc-900/50 shimmer-bg" />
              ))}
            </div>
          ) : !kanbanProjectId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 glass-panel">
              <KanbanSquare className="w-8 h-8 text-zinc-400" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No projects found</p>
              <p className="text-[10px] text-zinc-400">Create a project first, then add tasks to it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map((colKey) => {
                const columnTasks = kanbanColumns[colKey];
                return (
                  <div key={colKey} className="flex flex-col min-w-[220px] bg-zinc-100/30 dark:bg-zinc-900/10 border border-zinc-200/40 dark:border-zinc-800/60 rounded-2xl p-3 min-h-[420px]">
                    <div className="flex items-center justify-between gap-2 mb-3 border-b border-zinc-200/30 dark:border-zinc-800/40 pb-2">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        {colKey.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] font-bold bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnTasks.map((task) => (
                        <Card key={task.id} className="border-zinc-200/60 dark:border-zinc-850/80 shadow-sm hover:-translate-y-0.5 transition-all duration-200 bg-white/80 dark:bg-zinc-900/60">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                task.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                                'bg-zinc-100 text-zinc-650 dark:bg-zinc-800/80 dark:text-zinc-450'
                              }`}>
                                {task.priority}
                              </span>
                              <div className="flex gap-0.5">
                                <button onClick={() => setEditingTask(task)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-colors">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={() => setDeletingTask(task)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <h5 className="text-[11px] font-semibold text-zinc-850 dark:text-zinc-100 line-clamp-2 leading-relaxed">{task.title}</h5>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/20 dark:border-zinc-800/30 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                              {task.assignee ? (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-orange-500" />
                                  {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
                                </span>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-500 italic lowercase">unassigned</span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-0.5 text-zinc-400 font-medium lowercase">
                                  <Calendar className="w-3 h-3 text-zinc-400" />
                                  {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                              className="w-full h-7 mt-1.5 rounded border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-1.5 text-[10px] text-zinc-650 dark:text-zinc-300 focus:outline-none"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                              ))}
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

      {/* ── EDIT DIALOG ───────────────────────────── */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <DialogContent className="sm:max-w-lg glass-panel p-6">
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Edit Task</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 font-medium">Update the task details below.</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              projects={projectsList}
              users={usersList}
              initial={editingTask}
              onSubmit={(data) => updateMutation.mutate({ id: editingTask.id, ...data })}
              onCancel={() => setEditingTask(null)}
              isLoading={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ────────────────────── */}
      <Dialog open={!!deletingTask} onOpenChange={(open) => { if (!open) setDeletingTask(null); }}>
        <DialogContent className="sm:max-w-sm glass-panel p-6">
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Delete Task</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 font-medium">
              Are you sure you want to delete &quot;{deletingTask?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingTask(null)} className="text-xs">Cancel</Button>
            <Button
              onClick={() => deletingTask && deleteMutation.mutate(deletingTask.id)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
              Delete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
