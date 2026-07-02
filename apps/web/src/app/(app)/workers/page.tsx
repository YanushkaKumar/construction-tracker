'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, Plus, Loader2, AlertCircle, CalendarCheck, CircleDollarSign,
  Contact, SlidersHorizontal, CheckCircle2, CalendarDays, Coins
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  nic?: string;
  phone?: string;
  skillType?: string;
  dailyRate: number;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

interface PayrollRecord {
  workerId: string;
  firstName: string;
  lastName: string;
  skillType: string;
  dailyRate: number;
  daysPresent: number;
  halfDays: number;
  totalOvertimeHours: number;
  totalEarnings: number;
}

const workerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  nic: z.string().min(9, 'NIC must be at least 9 characters'),
  phone: z.string().optional(),
  skillType: z.string().default('Labourer'),
  dailyRate: z.coerce.number().min(0, 'Daily rate must be positive'),
});

type WorkerFormValues = z.infer<typeof workerSchema>;

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'payroll'>('roster');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj1');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  // Payroll date range
  const [payrollStart, setPayrollStart] = useState<string>(
    new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]
  );
  const [payrollEnd, setPayrollEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attendance state mapping (workerId -> { status, overtime })
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string; overtime: number }>>({});

  // Fetch workers list
  const { data: workersData, isLoading: isWorkersLoading } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => (await apiClient.get('/workers')).data,
    retry: 1,
  });

  // Fetch projects list
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
    retry: 1,
  });

  // Fetch payroll summary
  const { data: payrollData, isLoading: isPayrollLoading } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll', payrollStart, payrollEnd],
    queryFn: async () => {
      const response = await apiClient.get(
        `/workers/payroll-summary?startDate=${payrollStart}&endDate=${payrollEnd}`
      );
      return response.data;
    },
    enabled: activeTab === 'payroll',
    retry: 1,
  });

  // Register worker mutation
  const createWorkerMutation = useMutation({
    mutationFn: async (values: WorkerFormValues) => {
      return (await apiClient.post('/workers', values)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setMutateError(err.response?.data?.message || 'Failed to register worker');
    }
  });

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (records: any[]) => {
      return (await apiClient.post(`/projects/${selectedProjectId}/attendance`, { records })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      alert('Attendance saved successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save attendance');
    }
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      nic: '',
      phone: '',
      skillType: 'Labourer',
      dailyRate: 2500,
    },
  });

  const workers = workersData || [];
  const projectsList = projectsData?.data || [];
  const payroll = payrollData || [];

  const handleRegisterWorker = (values: any) => {
    setMutateError(null);
    createWorkerMutation.mutate(values);
  };

  const handleAttendanceChange = (workerId: string, status: string, overtime?: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [workerId]: {
        status: status || prev[workerId]?.status || 'PRESENT',
        overtime: overtime !== undefined ? overtime : (prev[workerId]?.overtime || 0),
      }
    }));
  };

  const submitAttendance = () => {
    const records = workers.map((w) => ({
      workerId: w.id,
      status: attendanceRecords[w.id]?.status || 'ABSENT',
      overtimeHours: attendanceRecords[w.id]?.overtime || 0,
      date: attendanceDate,
    }));
    saveAttendanceMutation.mutate(records);
  };

  const selectStyle = "h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Workforce</h1>
          <p className="text-caption mt-1">Manage personnel rosters, register logs, and calculate weekly payrolls.</p>
        </div>

        {activeTab === 'roster' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Register Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Register Worker Profile</DialogTitle>
                <DialogDescription>Create a personnel file and define standard wage rates.</DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleRegisterWorker)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-caption">First Name *</Label>
                    <Input id="firstName" placeholder="Saman" {...register('firstName')} />
                    {errors.firstName && <p className="text-[10px] text-destructive font-medium">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-caption">Last Name *</Label>
                    <Input id="lastName" placeholder="Kumara" {...register('lastName')} />
                    {errors.lastName && <p className="text-[10px] text-destructive font-medium">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nic" className="text-caption">NIC Number *</Label>
                    <Input id="nic" placeholder="881234567V" {...register('nic')} />
                    {errors.nic && <p className="text-[10px] text-destructive font-medium">{errors.nic.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-caption">Phone Number</Label>
                    <Input id="phone" placeholder="+9478..." {...register('phone')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="skillType" className="text-caption">Trade / Role *</Label>
                    <select 
                      id="skillType" 
                      className="flex h-9 w-full rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-medium"
                      {...register('skillType')}
                    >
                      <option value="Mason">Mason</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="Bar Bender">Bar Bender</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Labourer">Labourer</option>
                      <option value="Helper">Helper</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dailyRate" className="text-caption">Daily Rate (LKR) *</Label>
                    <Input id="dailyRate" type="number" {...register('dailyRate')} />
                    {errors.dailyRate && <p className="text-[10px] text-destructive font-medium">{errors.dailyRate.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving…</>
                    ) : (
                      'Save Worker'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
        {[
          { id: 'roster', label: 'Worker Register', icon: Contact },
          { id: 'attendance', label: 'Attendance Sheet', icon: CalendarCheck },
          { id: 'payroll', label: 'Payroll Ledger', icon: CircleDollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {isWorkersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Worker Name</th>
                          <th className="pb-3">NIC number</th>
                          <th className="pb-3">Contact phone</th>
                          <th className="pb-3">Trade / Role</th>
                          <th className="pb-3 text-right">Daily Standard Rate</th>
                          <th className="pb-3 pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((w) => (
                          <tr key={w.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                            <td className="py-3.5 pl-2 font-medium text-foreground">
                              {w.firstName} {w.lastName}
                            </td>
                            <td className="py-3.5 text-muted-foreground">{w.nic || '—'}</td>
                            <td className="py-3.5 text-muted-foreground">{w.phone || '—'}</td>
                            <td className="py-3.5">
                              <span className="bg-accent/40 border border-border/30 text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {w.skillType}
                              </span>
                            </td>
                            <td className="py-3.5 text-right font-bold text-foreground text-financial">LKR {w.dailyRate.toLocaleString()}</td>
                            <td className="py-3.5 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="status-dot status-active" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Active</span>
                              </div>
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
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-accent/20 border border-border/30 rounded-2xl">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="projectSelect" className="text-label text-muted-foreground/60">Select Project</Label>
                <select
                  id="projectSelect"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-8 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold"
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="attendanceDate" className="text-label text-muted-foreground/60">Attendance Date</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full h-8 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Attendance register list */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {workers.map((w) => {
                  const record = attendanceRecords[w.id] || { status: 'ABSENT', overtime: 0 };
                  return (
                    <div 
                      key={w.id} 
                      className="p-4 bg-accent/10 border border-border/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-xs text-foreground">{w.firstName} {w.lastName}</div>
                        <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase">{w.skillType} • LKR {w.dailyRate.toLocaleString()}/day</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="flex bg-accent/40 p-0.5 rounded-lg border border-border/40">
                          {['PRESENT', 'HALF_DAY', 'ABSENT'].map((status) => {
                            const isSel = record.status === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleAttendanceChange(w.id, status)}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
                                  isSel
                                    ? status === 'PRESENT' ? 'bg-success text-white shadow-sm' :
                                      status === 'HALF_DAY' ? 'bg-warning text-zinc-950 shadow-sm' :
                                      'bg-danger text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {status.replace('_', ' ')}
                              </button>
                            );
                          })}
                        </div>

                        {record.status !== 'ABSENT' && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`ot-${w.id}`} className="text-label text-muted-foreground/60 text-[9px]">OT Hours</Label>
                            <Input
                              id={`ot-${w.id}`}
                              type="number"
                              min="0"
                              max="8"
                              value={record.overtime}
                              onChange={(e) => handleAttendanceChange(w.id, record.status, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-center text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end pt-4 border-t border-border/40">
                  <Button 
                    onClick={submitAttendance}
                    disabled={saveAttendanceMutation.isPending}
                  >
                    {saveAttendanceMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Save Roster Register
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-4">
            {/* Range Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-accent/20 border border-border/30 rounded-2xl">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="payrollStart" className="text-label text-muted-foreground/60">Start Date</Label>
                <Input
                  id="payrollStart"
                  type="date"
                  value={payrollStart}
                  onChange={(e) => setPayrollStart(e.target.value)}
                  className="w-full h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="payrollEnd" className="text-label text-muted-foreground/60">End Date</Label>
                <Input
                  id="payrollEnd"
                  type="date"
                  value={payrollEnd}
                  onChange={(e) => setPayrollEnd(e.target.value)}
                  className="w-full h-8 text-xs font-semibold"
                />
              </div>
            </div>

            {isPayrollLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Worker</th>
                          <th className="pb-3">Trade / Role</th>
                          <th className="pb-3">Daily standard Rate</th>
                          <th className="pb-3">Days Logged</th>
                          <th className="pb-3">Total OT Hours</th>
                          <th className="pb-3 pr-2 text-right">Net Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payroll.map((pay, i) => (
                          <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                            <td className="py-3.5 pl-2 font-medium text-foreground">
                              {pay.firstName} {pay.lastName}
                            </td>
                            <td className="py-3.5 text-muted-foreground">{pay.skillType}</td>
                            <td className="py-3.5 text-muted-foreground text-financial">LKR {pay.dailyRate.toLocaleString()}</td>
                            <td className="py-3.5 text-muted-foreground">
                              {pay.daysPresent} Present {pay.halfDays > 0 && `• ${pay.halfDays} Half Days`}
                            </td>
                            <td className="py-3.5 text-muted-foreground text-financial">{pay.totalOvertimeHours} Hrs</td>
                            <td className="py-3.5 pr-2 text-right font-bold text-foreground text-financial">LKR {pay.totalEarnings.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
