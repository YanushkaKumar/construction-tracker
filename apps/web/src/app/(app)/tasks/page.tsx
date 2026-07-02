'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare, Calendar, User, AlertCircle, Loader2, Plus,
  KanbanSquare, ListTodo, Pencil, Trash2, X, Tag, ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
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

const priorityMeta: Record<string, { label: string; textClass: string; bgClass: string }> = {
  URGENT: { label: 'Urgent', textClass: 'text-danger', bgClass: 'bg-danger-subtle' },
  HIGH: { label: 'High', textClass: 'text-warning', bgClass: 'bg-warning-subtle' },
  MEDIUM: { label: 'Medium', textClass: 'text-info', bgClass: 'bg-info-subtle' },
  LOW: { label: 'Low', textClass: 'text-muted-foreground', bgClass: 'bg-accent/40' },
};

const statusMeta: Record<string, { label: string; dotClass: string }> = {
  TODO: { label: 'Todo', dotClass: 'bg-muted-foreground/30' },
  IN_PROGRESS: { label: 'Active', dotClass: 'status-active' },
  IN_REVIEW: { label: 'Review', dotClass: 'status-planning' },
  COMPLETED: { label: 'Done', dotClass: 'status-complete' },
  BLOCKED: { label: 'Blocked', dotClass: 'status-critical' },
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
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {!initial?.id && (
        <div className="space-y-1.5">
          <Label htmlFor="taskProject" className="text-caption">Project *</Label>
          <select
            id="taskProject"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="" disabled>Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="taskTitle" className="text-caption">Title *</Label>
        <Input
          id="taskTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Complete 8th floor slab casting"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="taskDesc" className="text-caption">Description</Label>
        <textarea
          id="taskDesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional task details..."
          rows={3}
          className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 resize-none placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="taskPriority" className="text-caption">Priority</Label>
          <select
            id="taskPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taskStatus" className="text-caption">Status</Label>
          <select
            id="taskStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="taskAssignee" className="text-caption">Assignee</Label>
          <select
            id="taskAssignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taskDueDate" className="text-caption">Due Date</Label>
          <Input
            id="taskDueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading || !title || (!initial?.id && !projectId)}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
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

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });
  const projectsList = projectsData?.data || [];

  const { data: usersData } = useQuery<{ data: CompanyUser[] }>({
    queryKey: ['company-users'],
    queryFn: async () => (await apiClient.get('/users')).data,
    retry: 1,
  });
  const usersList = usersData?.data || [];

  const { data: allTasksData, isLoading: isAllTasksLoading } = useQuery<Task[]>({
    queryKey: ['all-tasks', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId) {
        return (await apiClient.get(`/projects/${selectedProjectId}/tasks`)).data;
      }
      const tasks: Task[] = [];
      for (const p of projectsList) {
        try {
          const res = await apiClient.get(`/projects/${p.id}/tasks`);
          const projectTasks = (res.data || []).map((t: any) => ({ ...t, project: { id: p.id, name: p.name, code: p.code } }));
          tasks.push(...projectTasks);
        } catch { /* skip failed */ }
      }
      return tasks;
    },
    enabled: activeView === 'all-tasks' && projectsList.length > 0,
    retry: 1,
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { projectId, ...rest } = data;
      return (await apiClient.post(`/projects/${projectId}/tasks`, rest)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
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
    },
  });

  const allTasks = allTasksData || [];
  const kanbanTasks = kanbanTasksData || [];

  const kanbanColumns = {
    TODO: kanbanTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: kanbanTasks.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: kanbanTasks.filter((t) => t.status === 'IN_REVIEW'),
    COMPLETED: kanbanTasks.filter((t) => t.status === 'COMPLETED'),
    BLOCKED: kanbanTasks.filter((t) => t.status === 'BLOCKED'),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Tasks</h1>
          <p className="text-caption mt-1">Plan milestones, assign issues, and track task progression.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setActiveView('all-tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeView === 'all-tasks'
                  ? 'bg-card text-foreground border border-border/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => {
                setActiveView('kanban');
                if (!selectedProjectId && projectsList.length > 0) setSelectedProjectId(projectsList[0].id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeView === 'kanban'
                  ? 'bg-card text-foreground border border-border/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>Add a task to one of your projects.</DialogDescription>
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

      {/* Shared Filter Bar */}
      <div className="flex items-center gap-3 p-4 bg-accent/20 border border-border/30 rounded-2xl">
        <Label htmlFor="projectFilter" className="text-label text-muted-foreground/60 whitespace-nowrap">Filter by Project</Label>
        <select
          id="projectFilter"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="max-w-xs h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30"
        >
          <option value="">All Projects</option>
          {projectsList.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>
      </div>

      {/* ── LIST VIEW ─────────────────────────────── */}
      {activeView === 'all-tasks' && (
        <Card>
          <CardContent className="p-6">
            {isAllTasksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : allTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckSquare className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-title text-foreground mb-1">No tasks found</p>
                <p className="text-caption">Add tasks to initialize the work tracker.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTasks.map((task) => {
                  const prio = priorityMeta[task.priority] || { label: task.priority, textClass: '', bgClass: '' };
                  const stat = statusMeta[task.status] || { label: task.status, dotClass: '' };
                  return (
                    <div
                      key={task.id}
                      className="p-4 bg-accent/10 hover:bg-accent/20 rounded-xl border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 group"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-label text-muted-foreground/40 text-[9px]">
                            {task.project?.code || '—'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${prio.bgClass} ${prio.textClass}`}>
                            {prio.label}
                          </span>
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className={`status-dot ${stat.dotClass}`} />
                            <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
                          </div>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground truncate">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed font-medium">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-caption">
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-muted-foreground/40" />
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground/40" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={task.status}
                          disabled={statusMutation.isPending}
                          onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                          className="h-8 rounded-lg border border-border/60 bg-transparent px-2 text-xs outline-none focus-visible:border-foreground/30 font-medium"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground hover:bg-accent/40"
                          onClick={() => setEditingTask(task)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-danger hover:bg-danger-subtle"
                          onClick={() => setDeletingTask(task)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── KANBAN VIEW ───────────────────────────── */}
      {activeView === 'kanban' && (
        <div className="space-y-4">
          {isKanbanLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-60 rounded-xl bg-accent/20 shimmer-bg" />
              ))}
            </div>
          ) : !kanbanProjectId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center glass-panel">
              <KanbanSquare className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-title text-foreground mb-1">No projects found</p>
              <p className="text-caption">Initialize projects to structure your Kanban workflow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map((colKey) => {
                const columnTasks = kanbanColumns[colKey];
                const columnMeta = statusMeta[colKey] || { label: colKey, dotClass: '' };
                return (
                  <div key={colKey} className="flex flex-col min-w-[210px] bg-accent/10 border border-border/30 rounded-2xl p-3 min-h-[400px]">
                    <div className="flex items-center justify-between mb-3 border-b border-border/20 pb-2">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        {columnMeta.label}
                      </span>
                      <span className="text-[9px] font-bold bg-card text-muted-foreground px-2 py-0.5 rounded-full border border-border/20 text-financial">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnTasks.map((task) => {
                        const prio = priorityMeta[task.priority] || { label: task.priority, textClass: '', bgClass: '' };
                        return (
                          <Card key={task.id} className="border-border/30 shadow-surface hover:shadow-panel transition-all duration-200">
                            <CardContent className="p-3 space-y-2.5">
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${prio.bgClass} ${prio.textClass}`}>
                                  {prio.label}
                                </span>
                                <div className="flex gap-0.5">
                                  <button onClick={() => setEditingTask(task)} className="p-1 rounded hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setDeletingTask(task)} className="p-1 rounded hover:bg-accent/40 text-muted-foreground hover:text-danger transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <h5 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-relaxed">{task.title}</h5>
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                {task.assignee ? (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-muted-foreground/40" />
                                    {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50 italic lowercase">unassigned</span>
                                )}
                                {task.dueDate && (
                                  <span className="flex items-center gap-0.5 text-muted-foreground font-medium lowercase">
                                    <Calendar className="w-3 h-3 text-muted-foreground/40" />
                                    {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <select
                                value={task.status}
                                onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                                className="w-full h-7 mt-1 rounded border border-border/60 bg-transparent px-1.5 text-[10px] focus:outline-none"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            </CardContent>
                          </Card>
                        );
                      })}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details below.</DialogDescription>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingTask?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setDeletingTask(null)}>Cancel</Button>
            <Button
              onClick={() => deletingTask && deleteMutation.mutate(deletingTask.id)}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Delete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
