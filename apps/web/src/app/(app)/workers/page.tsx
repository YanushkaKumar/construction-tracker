'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, 
  Plus, 
  Loader2, 
  AlertCircle,
  CalendarCheck,
  CircleDollarSign,
  Contact,
  SlidersHorizontal,
  FolderDot,
  CheckCircle2,
  CalendarDays,
  Coins,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    queryFn: async () => {
      const response = await apiClient.get('/workers');
      return response.data;
    },
    retry: 1,
  });

  // Fetch projects list
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data;
    },
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
      const response = await apiClient.post('/workers', values);
      return response.data;
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
      const response = await apiClient.post(`/projects/${selectedProjectId}/attendance`, { records });
      return response.data;
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

  // Mock fallbacks
  const mockWorkers: Worker[] = [
    { id: 'w1', firstName: 'Saman', lastName: 'Kumara', nic: '881234567V', phone: '+94781234567', skillType: 'Mason', dailyRate: 3500, isActive: true },
    { id: 'w2', firstName: 'Ruwan', lastName: 'Bandara', nic: '901234567V', phone: '+94782345678', skillType: 'Carpenter', dailyRate: 3200, isActive: true },
    { id: 'w3', firstName: 'Pradeep', lastName: 'Wijesinghe', nic: '921234567V', phone: '+94784567890', skillType: 'Labourer', dailyRate: 2500, isActive: true },
  ];

  const mockPayroll: PayrollRecord[] = [
    { workerId: 'w1', firstName: 'Saman', lastName: 'Kumara', skillType: 'Mason', dailyRate: 3500, daysPresent: 5, halfDays: 0, totalOvertimeHours: 4, totalEarnings: 19250 },
    { workerId: 'w2', firstName: 'Ruwan', lastName: 'Bandara', skillType: 'Carpenter', dailyRate: 3200, daysPresent: 4, halfDays: 1, totalOvertimeHours: 0, totalEarnings: 14400 },
    { workerId: 'w3', firstName: 'Pradeep', lastName: 'Wijesinghe', skillType: 'Labourer', dailyRate: 2500, daysPresent: 5, halfDays: 0, totalOvertimeHours: 2, totalEarnings: 13125 }
  ];

  const workers = workersData || mockWorkers;
  const projectsList = projectsData?.data || [
    { id: 'prj1', name: 'Horizon Tower - Colombo 07', code: 'PRJ-001' },
    { id: 'prj2', name: 'Palm Villa - Negombo', code: 'PRJ-002' }
  ];
  const payroll = payrollData || mockPayroll;

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

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Workforce & Attendance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage worker rosters, log daily site attendance, and aggregate payrolls.
          </p>
        </div>

        {/* Create Dialog Trigger (Only active on Roster Tab) */}
        {activeTab === 'roster' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/10" />}>
              <Plus className="w-4 h-4 mr-2" />
              Register Worker
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register Worker Profile</DialogTitle>
                <DialogDescription>
                  Enter personal credentials and daily wage rates for roster records.
                </DialogDescription>
              </DialogHeader>

              {mutateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mutateError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleRegisterWorker)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Saman" {...register('firstName')} />
                    {errors.firstName && <p className="text-xs text-destructive font-medium">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Kumara" {...register('lastName')} />
                    {errors.lastName && <p className="text-xs text-destructive font-medium">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nic">NIC Number *</Label>
                    <Input id="nic" placeholder="881234567V" {...register('nic')} />
                    {errors.nic && <p className="text-xs text-destructive font-medium">{errors.nic.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+9478..." {...register('phone')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skillType">Skill Trade / Role *</Label>
                    <select 
                      id="skillType" 
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
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
                  <div className="space-y-2">
                    <Label htmlFor="dailyRate">Daily Wage Rate (LKR) *</Label>
                    <Input id="dailyRate" type="number" {...register('dailyRate')} />
                    {errors.dailyRate && <p className="text-xs text-destructive font-medium">{errors.dailyRate.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
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

      {/* Tabs navigation */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2 pb-px">
        {[
          { id: 'roster', label: 'Worker Register', icon: Contact },
          { id: 'attendance', label: 'Daily Attendance Sheet', icon: CalendarCheck },
          { id: 'payroll', label: 'Payroll Ledger', icon: CircleDollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                isActive 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-500 font-semibold' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content panels */}
      <div className="pt-2">
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {isWorkersLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Registered Workforce Roster</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Worker Name</th>
                          <th className="pb-3 font-semibold">NIC number</th>
                          <th className="pb-3 font-semibold">Contact phone</th>
                          <th className="pb-3 font-semibold">Skill Trade</th>
                          <th className="pb-3 font-semibold">Daily Rate</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((w) => (
                          <tr key={w.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                              {w.firstName} {w.lastName}
                            </td>
                            <td className="py-3.5 text-zinc-500 text-xs">{w.nic || 'N/A'}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">{w.phone || 'N/A'}</td>
                            <td className="py-3.5">
                              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {w.skillType}
                              </span>
                            </td>
                            <td className="py-3.5 font-bold text-zinc-900 dark:text-white">LKR {w.dailyRate.toLocaleString()}</td>
                            <td className="py-3.5">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Active</span>
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
            {/* Project & Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="space-y-1.5">
                <Label htmlFor="projectSelect" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Project</Label>
                <select
                  id="projectSelect"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="attendanceDate" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Attendance Date</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full h-10 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Attendance checklist */}
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base">Daily Attendance Roster</CardTitle>
                  <CardDescription>Mark attendance registers for the selected site date</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workers.map((w) => {
                  const record = attendanceRecords[w.id] || { status: 'ABSENT', overtime: 0 };
                  return (
                    <div 
                      key={w.id} 
                      className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{w.firstName} {w.lastName}</div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{w.skillType} • LKR {w.dailyRate.toLocaleString()}/day</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        {/* Attendance status toggle */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          {['PRESENT', 'HALF_DAY', 'ABSENT'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleAttendanceChange(w.id, status)}
                              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
                                record.status === status
                                  ? status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-sm' :
                                    status === 'HALF_DAY' ? 'bg-amber-500 text-zinc-950 shadow-sm' :
                                    'bg-rose-500 text-white shadow-sm'
                                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                              }`}
                            >
                              {status.replace('_', ' ')}
                            </button>
                          ))}
                        </div>

                        {/* Overtime input */}
                        {record.status !== 'ABSENT' && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`ot-${w.id}`} className="text-[10px] font-bold text-zinc-400 uppercase">OT Hours</Label>
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

                <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button 
                    onClick={submitAttendance}
                    disabled={saveAttendanceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {saveAttendanceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Attendance Register
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
            {/* Date range picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="space-y-1.5">
                <Label htmlFor="payrollStart" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Date</Label>
                <Input
                  id="payrollStart"
                  type="date"
                  value={payrollStart}
                  onChange={(e) => setPayrollStart(e.target.value)}
                  className="w-full h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payrollEnd" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Date</Label>
                <Input
                  id="payrollEnd"
                  type="date"
                  value={payrollEnd}
                  onChange={(e) => setPayrollEnd(e.target.value)}
                  className="w-full h-10 text-xs font-semibold"
                />
              </div>
            </div>

            {isPayrollLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Aggregated Payroll Roster Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Worker</th>
                          <th className="pb-3 font-semibold">Skill Trade</th>
                          <th className="pb-3 font-semibold">Daily Rate</th>
                          <th className="pb-3 font-semibold">Attendance Log</th>
                          <th className="pb-3 font-semibold">Total OT Hours</th>
                          <th className="pb-3 font-semibold">Earnings (LKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payroll.map((pay, i) => (
                          <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                              {pay.firstName} {pay.lastName}
                            </td>
                            <td className="py-3.5 text-zinc-500 text-xs">{pay.skillType}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">LKR {pay.dailyRate.toLocaleString()}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">
                              {pay.daysPresent} Days Present {pay.halfDays > 0 && `• ${pay.halfDays} Half Days`}
                            </td>
                            <td className="py-3.5 text-zinc-500 text-xs">{pay.totalOvertimeHours} Hrs</td>
                            <td className="py-3.5 font-bold text-zinc-900 dark:text-white">LKR {pay.totalEarnings.toLocaleString()}</td>
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
