'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare, Calendar, User, AlertCircle, Loader2, Plus,
  KanbanSquare, ListTodo, Pencil, Trash2, X, Tag, ChevronRight, Download
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
import { StatusBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  URGENT: { label: 'Urgent', textClass: 'text-danger', bgClass: 'bg-danger-subtle/10 border-danger/25' },
  HIGH: { label: 'High', textClass: 'text-warning', bgClass: 'bg-warning-subtle/10 border-warning/25' },
  MEDIUM: { label: 'Medium', textClass: 'text-info', bgClass: 'bg-info-subtle/10 border-info/25' },
  LOW: { label: 'Low', textClass: 'text-muted-foreground', bgClass: 'bg-accent/40 border-border/20' },
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

  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left font-semibold">
      {!initial?.id && (
        <div className="space-y-1.5">
          <Label htmlFor="taskProject" className="text-xs font-semibold text-foreground/80">Project *</Label>
          <select
            id="taskProject"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
          >
            <option value="" disabled>Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="taskTitle" className="text-xs font-semibold text-foreground/80">Task Title *</Label>
        <Input
          id="taskTitle"
          required
          placeholder="Cure structural columns..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="taskDesc" className="text-xs font-semibold text-foreground/80">Description</Label>
        <textarea
          id="taskDesc"
          placeholder="Ensure continuous hydration for 7 days..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex min-h-[60px] w-full rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-foreground/30 resize-none placeholder:text-muted-foreground/50 font-semibold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="taskPriority" className="text-xs font-semibold text-foreground/80">Priority</Label>
          <select
            id="taskPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="taskStatus" className="text-xs font-semibold text-foreground/80">Status</Label>
          <select
            id="taskStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="taskAssignee" className="text-xs font-semibold text-foreground/80">Assignee</Label>
          <select
            id="taskAssignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="taskDueDate" className="text-xs font-semibold text-foreground/80">Due Date</Label>
          <Input
            id="taskDueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputStyle}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
        <Button type="button" variant="outline" className="rounded-xl h-10 text-xs font-semibold" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="font-semibold h-10 rounded-xl text-xs px-4" disabled={isLoading || !title || (!initial?.id && !projectId)}>
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

  // Search, Sorting, Filters, Bulk Selection and Pagination States
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<'title' | 'dueDate' | 'priority'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
        } catch { /* skip */ }
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

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await apiClient.delete(`/tasks/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      setSelectedTaskIds({});
    }
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

  // Local Client Filtering and Searching
  const filteredTasks = allTasks
    .filter(task => {
      const matchSearch = task.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Local Client Pagination Calculations
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: 'title' | 'dueDate' | 'priority') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds: Record<string, boolean> = {};
      paginatedTasks.forEach(t => pageIds[t.id] = true);
      setSelectedTaskIds(pageIds);
    } else {
      setSelectedTaskIds({});
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedTaskIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const hasSelectedTasks = Object.values(selectedTaskIds).some(Boolean);
  const selectedTaskCount = Object.values(selectedTaskIds).filter(Boolean).length;

  const handleBulkCSVExport = () => {
    const selectedIds = Object.keys(selectedTaskIds).filter(id => selectedTaskIds[id]);
    const exportData = allTasks.filter(t => selectedIds.includes(t.id));
    const csvRows = exportData.map(t => ({
      ID: t.id,
      Project: t.project?.code || '',
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      DueDate: t.dueDate || ''
    }));
    // Reusable CSV Exporter
    const headers = ["ID", "Project", "Title", "Status", "Priority", "DueDate"];
    const rows = csvRows.map(row => headers.map(h => `"${(row as any)[h]}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `selected_tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(selectedTaskIds).filter(id => selectedTaskIds[id]);
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected tasks?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground/90">Task Manager</h1>
          <p className="text-[13px] text-muted-foreground/65 mt-0.5 font-medium">Assign work, schedule deliverables, and track site operations across all workspaces.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-accent/25 p-1 rounded-xl border border-border/25 select-none">
            <button
              onClick={() => setActiveView('all-tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeView === 'all-tasks'
                  ? 'bg-card text-foreground border border-border/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeView === 'kanban'
                  ? 'bg-card text-foreground border border-border/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Board View</span>
            </button>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-semibold h-9 px-3 rounded-xl text-xs transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
              <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                <DialogTitle className="text-sm font-bold">Create Task</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">Assign deliverables to active site teams.</DialogDescription>
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

      {/* Control Filters Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 p-3.5 bg-accent/15 border border-border/20 rounded-xl select-none text-left">
        <div className="flex items-center gap-2 flex-1">
          <Label htmlFor="taskSearch" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Search</Label>
          <Input 
            id="taskSearch" 
            placeholder="Search task titles..." 
            value={searchText} 
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} 
            className="h-8.5 rounded-xl border border-border/25 bg-background text-xs" 
          />
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="projectFilter" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Filter Workspace</Label>
            <select
              id="projectFilter"
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setCurrentPage(1); }}
              className={selectStyle}
            >
              <option value="">All Active Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="statusFilter" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Status</Label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className={selectStyle}
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action selection banner */}
      {hasSelectedTasks && (
        <div className="flex items-center justify-between p-3.5 bg-accent/30 border border-border/40 rounded-xl select-none animate-scale-in text-left">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-foreground rounded-full animate-pulse-soft" />
            <span className="text-[13px] font-bold text-foreground">{selectedTaskCount} Tasks selected</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBulkCSVExport} className="bg-background text-foreground border border-border hover:bg-accent/40 rounded-xl h-8.5 text-xs font-bold px-3">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Selected
            </Button>
            <Button onClick={handleBulkDelete} className="bg-danger text-danger-foreground hover:bg-danger/90 rounded-xl h-8.5 text-xs font-bold px-3">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────── */}
      {activeView === 'all-tasks' && (
        <Card className="glass-panel border-border/30 shadow-panel">
          <CardContent className="p-4">
            {isAllTasksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-accent/15 border border-border/20 shimmer-bg" />
                ))}
              </div>
            ) : paginatedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                <CheckSquare className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
                <p className="text-sm font-bold text-foreground mb-1">No tasks logged in this filter</p>
                <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">Add a task to project workspaces to start tracking daily operational targets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[10px] select-none font-mono">
                      <th className="pb-2.5 pl-2 pt-1.5 w-8">
                        <input 
                          type="checkbox" 
                          onChange={handleToggleSelectAll} 
                          checked={paginatedTasks.every(t => selectedTaskIds[t.id])}
                          className="w-4 h-4 rounded border-border" 
                        />
                      </th>
                      <th className="pb-2.5 pt-1.5 font-bold cursor-pointer hover:text-foreground" onClick={() => handleSort('title')}>Task Detail</th>
                      <th className="pb-2.5 pt-1.5 font-bold">Project</th>
                      <th className="pb-2.5 pt-1.5 font-bold">Status</th>
                      <th className="pb-2.5 pt-1.5 font-bold cursor-pointer hover:text-foreground" onClick={() => handleSort('priority')}>Priority</th>
                      <th className="pb-2.5 pt-1.5 font-bold">Assignee</th>
                      <th className="pb-2.5 pt-1.5 font-bold cursor-pointer hover:text-foreground" onClick={() => handleSort('dueDate')}>Due Date</th>
                      <th className="pb-2.5 pt-1.5 pr-2 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((task) => {
                      const prio = priorityMeta[task.priority] || { label: task.priority, textClass: '', bgClass: '' };
                      const stat = statusMeta[task.status] || { label: task.status, dotClass: '' };
                      const isSelected = !!selectedTaskIds[task.id];

                      return (
                        <tr key={task.id} className={`border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors font-semibold ${isSelected ? 'bg-accent/25' : ''}`}>
                          <td className="py-2.5 pl-2">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleToggleSelectRow(task.id)}
                              className="w-4 h-4 rounded border-border" 
                            />
                          </td>
                          <td className="py-2.5">
                            <div>
                              <div className="font-bold text-[15px] text-foreground">{task.title}</div>
                              {task.description && (
                                <span className="text-[13px] text-muted-foreground/75 font-normal line-clamp-1 mt-0.5">{task.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 text-muted-foreground/80 font-mono text-[13px] uppercase">{task.project?.code || '—'}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1.5 select-none">
                              <span className={`status-dot ${stat.dotClass}`} />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${prio.bgClass} ${prio.textClass}`}>
                              {prio.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground/80 text-[13px] font-semibold">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</td>
                          <td className="py-2.5 text-muted-foreground/80 font-mono text-[13px] font-semibold">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-2.5 pr-2 text-right select-none">
                            <div className="flex items-center justify-end gap-1.5">
                              <select
                                value={task.status}
                                disabled={statusMutation.isPending}
                                onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                                className="h-8 rounded-xl border border-border/25 bg-background px-2 text-xs outline-none focus-visible:border-foreground/30 font-semibold"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-muted-foreground hover:text-foreground hover:bg-accent/40 rounded-lg"
                                onClick={() => setEditingTask(task)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-muted-foreground hover:text-danger hover:bg-danger-subtle rounded-lg"
                                onClick={() => setDeletingTask(task)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Local Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/15 mt-4 select-none font-semibold">
                    <span className="text-xs text-muted-foreground/60">Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                      <Button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(prev => prev - 1)} 
                        variant="outline" 
                        className="h-8 px-3 rounded-lg text-xs"
                      >
                        Previous
                      </Button>
                      <Button 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(prev => prev + 1)} 
                        variant="outline" 
                        className="h-8 px-3 rounded-lg text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
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
                <div key={i} className="h-60 rounded-2xl bg-accent/15 border border-border/20 shimmer-bg" />
              ))}
            </div>
          ) : !kanbanProjectId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-panel border-border/30 rounded-2xl select-none">
              <KanbanSquare className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
              <p className="text-sm font-bold text-foreground mb-1">No active projects found</p>
              <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">Initialize project records to view the Kanban sprint board.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
              {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map((colKey) => {
                const columnTasks = kanbanColumns[colKey];
                const columnMeta = statusMeta[colKey] || { label: colKey, dotClass: '' };
                return (
                  <div key={colKey} className={cn(
                    'flex flex-col min-w-[230px] rounded-2xl p-3 min-h-[480px] text-left border',
                    colKey === 'TODO'        ? 'bg-accent/15 border-border/20' :
                    colKey === 'IN_PROGRESS' ? 'bg-primary/[0.04] border-primary/15' :
                    colKey === 'IN_REVIEW'   ? 'bg-info/[0.04] border-info/15' :
                    colKey === 'COMPLETED'   ? 'bg-success/[0.04] border-success/15' :
                                              'bg-danger/[0.04] border-danger/15'
                  )}>
                    <div className="flex items-center justify-between mb-3.5 border-b border-border/20 pb-2.5 select-none">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
                          colKey === 'TODO'        ? 'bg-muted-foreground/40' :
                          colKey === 'IN_PROGRESS' ? 'bg-primary' :
                          colKey === 'IN_REVIEW'   ? 'bg-info' :
                          colKey === 'COMPLETED'   ? 'bg-success' :
                                                    'bg-danger'
                        )} aria-hidden />
                        <span className="text-[13px] font-bold text-foreground/80">
                          {columnMeta.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-card text-muted-foreground/70 px-2 py-0.5 rounded-full border border-border/20 font-mono min-w-[20px] text-center">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                      {columnTasks.map((task) => {
                        const prio = priorityMeta[task.priority] || { label: task.priority, textClass: '', bgClass: '' };
                        return (
                          <Card key={task.id} className="border-border/25 shadow-surface hover:shadow-panel hover:border-border/40 transition-all duration-200 rounded-xl relative overflow-hidden bg-card">
                            <CardContent className="p-3 space-y-2.5 font-semibold text-left">
                              <div className="flex justify-between items-start gap-1 select-none">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${prio.bgClass} ${prio.textClass}`}>
                                  {prio.label}
                                </span>
                                <div className="flex gap-0.5">
                                  <button onClick={() => setEditingTask(task)} className="p-1 rounded hover:bg-accent/45 text-muted-foreground hover:text-foreground transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setDeletingTask(task)} className="p-1 rounded hover:bg-accent/45 text-muted-foreground hover:text-danger transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <h5 className="text-[13px] font-bold text-foreground/90 leading-snug line-clamp-2">{task.title}</h5>
                              {task.description && (
                                <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/15 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider select-none font-mono">
                                {task.assignee ? (
                                  <span className="flex items-center gap-1 truncate max-w-[100px]">
                                    <User className="w-3.5 h-3.5 text-muted-foreground/45" />
                                    {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/45 italic lowercase">unassigned</span>
                                )}
                                {task.dueDate && (
                                  <span className="flex items-center gap-0.5 font-semibold lowercase shrink-0">
                                    <Calendar className="w-3 h-3 text-muted-foreground/45" />
                                    {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <select
                                value={task.status}
                                onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                                className="w-full h-7 mt-1.5 rounded-lg border border-border/25 bg-background px-2 text-[10px] focus:outline-none font-bold"
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
        <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
          <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
            <DialogTitle className="text-sm font-bold">Edit Task</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Update the task requirements or change status.</DialogDescription>
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
        <DialogContent className="sm:max-w-sm bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
          <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
            <DialogTitle className="text-sm font-bold">Delete Task</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Are you sure you want to permanently delete &quot;{deletingTask?.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3 border-t border-border/15 select-none">
            <Button variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={() => setDeletingTask(null)}>Cancel</Button>
            <Button
              onClick={() => deletingTask && deleteMutation.mutate(deletingTask.id)}
              disabled={deleteMutation.isPending}
              className="bg-danger text-danger-foreground hover:bg-danger/90 rounded-xl h-9 text-xs font-bold"
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
