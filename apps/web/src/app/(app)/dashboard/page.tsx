'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  FileSpreadsheet, 
  ClipboardCheck, 
  HandCoins,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  HardHat,
  Sun,
  Coins,
  CheckSquare,
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardData {
  kpis: {
    activeProjects: number;
    totalProjects: number;
    budgetUtilization: number;
    pendingExpenses: number;
    pendingExpenseAmount: number;
    workersOnSite: number;
  };
  charts: {
    projectsByStatus: Array<{ status: string; count: number }>;
    expenseByCategory: Array<{ category: string; total: number }>;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    user: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [siteLogWeather, setSiteLogWeather] = useState('Sunny');
  const [siteLogSummary, setSiteLogSummary] = useState('');
  const [siteLogStatus, setSiteLogStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard');
      return response.data;
    },
    retry: 1,
  });

  // Safe fallback mock data in case API is offline during initial startup
  const mockData: DashboardData = {
    kpis: {
      activeProjects: 2,
      totalProjects: 3,
      budgetUtilization: 47,
      pendingExpenses: 2,
      pendingExpenseAmount: 1510000,
      workersOnSite: 12,
    },
    charts: {
      projectsByStatus: [
        { status: 'IN_PROGRESS', count: 2 },
        { status: 'PLANNING', count: 1 }
      ],
      expenseByCategory: [
        { category: 'MATERIAL', total: 370000 },
        { category: 'EQUIPMENT', total: 120000 }
      ]
    },
    recentActivities: [
      { id: '1', action: 'CREATE', entityType: 'Project', user: 'Chamara Perera', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: '2', action: 'APPROVE', entityType: 'Expense', user: 'Nimal Fernando', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: '3', action: 'MARK_ATTENDANCE', entityType: 'Worker', user: 'Kasun Silva', createdAt: new Date(Date.now() - 10800000).toISOString() }
    ]
  };

  const activeData = data || mockData;

  const handleSiteLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSiteLogStatus('Submitting...');
    setTimeout(() => {
      setSiteLogStatus('Site daily log submitted successfully!');
      setSiteLogSummary('');
      setTimeout(() => setSiteLogStatus(null), 3000);
    }, 1000);
  };

  // Determine user role (Owner, PM, Engineer, Worker)
  const role = user?.role || 'COMPANY_OWNER';

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Ayubowan, {user?.firstName || 'User'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {role === 'COMPANY_OWNER' && "Here is your company profile command summary."}
            {role === 'PROJECT_MANAGER' && "Here are your managed projects and pending approvals."}
            {role === 'SITE_ENGINEER' && "Here are your supervisor tasks and active site telemetry."}
            {role === 'WORKER' && "Here is your shift schedule checklist and personal wage ledger."}
          </p>
        </div>
        
        {/* Role label badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/15">
          <HardHat className="w-4 h-4" />
          {role.replace('_', ' ')} VIEW
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* ROLE 1: COMPANY OWNER DASHBOARD                         */}
      {/* ──────────────────────────────────────────────────────── */}
      {role === 'COMPANY_OWNER' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Projects</CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Building2 className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950 dark:text-white">{activeData.kpis.activeProjects}</div>
                <p className="text-[10px] text-zinc-400 mt-1">Out of {activeData.kpis.totalProjects} total sites</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Budget Spent</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><TrendingUp className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950 dark:text-white">{activeData.kpis.budgetUtilization}%</div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activeData.kpis.budgetUtilization}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Workers On Site</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><Users className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950 dark:text-white">{activeData.kpis.workersOnSite}</div>
                <p className="text-[10px] text-zinc-400 mt-1">Active labour registers today</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Sign-off</CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600"><AlertCircle className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950 dark:text-white">{activeData.kpis.pendingExpenses}</div>
                <p className="text-[10px] text-zinc-400 mt-1">LKR {activeData.kpis.pendingExpenseAmount.toLocaleString()} pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader><CardTitle className="text-lg">Owner Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-2">
                  <Link href="/projects"><Button className="w-full justify-start text-sm bg-amber-500 text-zinc-950 hover:bg-amber-600 font-bold shadow-md"><Plus className="w-4 h-4 mr-3" />Create Project</Button></Link>
                  <Link href="/expenses"><Button variant="outline" className="w-full justify-start text-sm border-zinc-200 dark:border-zinc-850"><HandCoins className="w-4 h-4 mr-3 text-amber-500" />Approve Site Expenses</Button></Link>
                  <Link href="/settings"><Button variant="outline" className="w-full justify-start text-sm border-zinc-200 dark:border-zinc-855"><Users className="w-4 h-4 mr-3 text-amber-500" />Manage Company Team</Button></Link>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-8">
              <Card className="border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
                <CardHeader><CardTitle className="text-lg">Recent Audit Logs</CardTitle></CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {activeData.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 text-sm pb-4 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-semibold text-xs">{activity.user.charAt(0)}</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-zinc-850"><span className="font-semibold text-zinc-950">{activity.user}</span> logged <span className="font-medium text-amber-600">{activity.action}</span> on {activity.entityType}</p>
                          <p className="text-xs text-zinc-400">{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(activity.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 mt-6 border-t border-zinc-200/80">
                    <Link href="/settings" className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-500">View Audit Logs <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* ROLE 2: PROJECT MANAGER DASHBOARD                        */}
      {/* ──────────────────────────────────────────────────────── */}
      {role === 'PROJECT_MANAGER' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Managed Sites</CardTitle>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600"><Briefcase className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">2 Projects</div>
                <p className="text-[10px] text-zinc-400 mt-1">Horizon Tower, Palm Villa</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Open Tasks</CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><CheckCircle2 className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">8 Tasks</div>
                <p className="text-[10px] text-zinc-400 mt-1">6 in progress, 2 to do</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Labour</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><Users className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">28 Workers</div>
                <p className="text-[10px] text-zinc-400 mt-1">Across 2 assigned project sites</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Vouchers</CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600"><Coins className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">3 Expense Vouchers</div>
                <p className="text-[10px] text-zinc-400 mt-1">Awaiting PM verification</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Managed Projects list */}
            <div className="lg:col-span-7">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Site Schedules & Progress</CardTitle>
                  <CardDescription>Timelines and target completions for assigned locations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-800">Horizon Tower - Colombo 07 (PRJ-001)</span>
                      <span className="text-amber-600">58% Completed</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[58%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-550 pt-1">
                      <span>Assigned to Kasun Silva (Engineer)</span>
                      <span>Target: June 2027</span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-800">Palm Villa - Negombo (PRJ-002)</span>
                      <span className="text-amber-600">35% Completed</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[35%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-550 pt-1">
                      <span>Assigned to Kasun Silva (Engineer)</span>
                      <span>Target: Dec 2026</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PM Actions & Vouchers */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Manager Inbox</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-150">
                    <div>
                      <div className="font-bold text-zinc-800">Cement bags batch invoice</div>
                      <span className="text-[10px] text-zinc-400">PRJ-001 • LKR 145,000</span>
                    </div>
                    <Link href="/expenses"><Button size="xs" className="bg-amber-500 text-zinc-950 hover:bg-amber-600 font-bold">Approve</Button></Link>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-zinc-800">MEP installation contractor voucher</div>
                      <span className="text-[10px] text-zinc-400">PRJ-001 • LKR 1,200,000</span>
                    </div>
                    <Link href="/expenses"><Button size="xs" className="bg-amber-500 text-zinc-950 hover:bg-amber-600 font-bold">Approve</Button></Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader><CardTitle className="text-lg">Task Allocation</CardTitle></CardHeader>
                <CardContent>
                  <Link href="/tasks"><Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold"><Plus className="w-4 h-4 mr-2" />Assign Tasks to Engineers</Button></Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* ROLE 3: SITE ENGINEER DASHBOARD                         */}
      {/* ──────────────────────────────────────────────────────── */}
      {role === 'SITE_ENGINEER' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Site Tasks</CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><CheckSquare className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">4 Active Tasks</div>
                <p className="text-[10px] text-zinc-400 mt-1">Ongoing today at Horizon Tower</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Workers On Site</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><Users className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">14 Present</div>
                <p className="text-[10px] text-zinc-400 mt-1">Daily shift attendance marked</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stock Alert Level</CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600"><AlertCircle className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">2 Materials Low</div>
                <p className="text-[10px] text-rose-600 mt-1">Aggregates, River Sand logs low</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Site Weather</CardTitle>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600"><Sun className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">32°C Sunny</div>
                <p className="text-[10px] text-zinc-400 mt-1">Perfect condition for concrete pour</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's site log form */}
            <div className="lg:col-span-6">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Submit Daily Site Log</CardTitle>
                  <CardDescription>Submit logs and photos directly from the supervisor workspace</CardDescription>
                </CardHeader>
                <CardContent>
                  {siteLogStatus && (
                    <div className="p-3 mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">{siteLogStatus}</div>
                  )}

                  <form onSubmit={handleSiteLogSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="weather" className="text-xs font-bold text-zinc-550 uppercase">Weather Condition</Label>
                      <select 
                        id="weather"
                        value={siteLogWeather} 
                        onChange={(e) => setSiteLogWeather(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs"
                      >
                        <option value="Sunny">Sunny / Clear</option>
                        <option value="Rainy">Rainy / Interrupted</option>
                        <option value="Cloudy">Cloudy / Cool</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workSummary" className="text-xs font-bold text-zinc-550 uppercase">Work Summary Log *</Label>
                      <textarea
                        id="workSummary"
                        required
                        value={siteLogSummary}
                        onChange={(e) => setSiteLogSummary(e.target.value)}
                        placeholder="e.g. Completed concrete pour on 8th-floor slab, checking reinforcement bars."
                        className="w-full h-24 rounded-lg border border-zinc-200 bg-white p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="bg-amber-500 text-zinc-950 hover:bg-amber-600 font-bold">Submit Daily Log</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Attendance checklist */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Worker Attendance Checklist</CardTitle>
                  <CardDescription>Rapid daily check-in logs for site labour roster</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-xs pb-2.5 border-b border-zinc-150">
                    <div className="font-bold text-zinc-850">L.K. Saman Kumara (Mason)</div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Checked In</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2.5 border-b border-zinc-150">
                    <div className="font-bold text-zinc-850">A. Hemantha Perera (Carpenter)</div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Checked In</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="font-bold text-zinc-850">M. Sunil Shantha (Labourer)</div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">Absent</span>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-200/80">
                    <Link href="/workers"><Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold"><ClipboardCheck className="w-4 h-4 mr-2" />Open Daily Roster Grid</Button></Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* ROLE 4: WORKER DASHBOARD                                 */}
      {/* ──────────────────────────────────────────────────────── */}
      {role === 'WORKER' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">My Shift Status</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">Checked In</div>
                <p className="text-[10px] text-zinc-400 mt-1">Shift started at 8:00 AM today</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Earnings</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><Coins className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">LKR 3,500</div>
                <p className="text-[10px] text-zinc-400 mt-1">Fixed daily rate (Horizon Tower)</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Attendance Logs</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><Calendar className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">18 Days</div>
                <p className="text-[10px] text-zinc-400 mt-1">Checked-in shifts this month</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assigned Tasks</CardTitle>
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600"><CheckSquare className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-950">2 Tasks</div>
                <p className="text-[10px] text-zinc-400 mt-1">Assigned for concrete shift</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's checklist */}
            <div className="lg:col-span-8">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">My Today's Task Checklist</CardTitle>
                  <CardDescription>Complete assigned tasks for today's shift</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150">
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded border-zinc-300 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-zinc-800 line-through opacity-60">Mix concrete aggregate for Phase 2B</div>
                      <span className="text-[10px] text-zinc-400 line-through">Assigned by Kasun Silva (Engineer)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150">
                    <input type="checkbox" className="w-5 h-5 accent-amber-500 rounded border-zinc-300 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-zinc-800">Cast concrete columns on 8th floor</div>
                      <span className="text-[10px] text-zinc-400">Assigned by Kasun Silva (Engineer)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance history logs */}
            <div className="lg:col-span-4">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Shift History Logs</CardTitle>
                  <CardDescription>Recent check-in details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-150">
                    <div>
                      <div className="font-bold text-zinc-850">23 June 2026</div>
                      <span className="text-[10px] text-zinc-400">8:00 AM - 5:00 PM</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Checked In</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-150">
                    <div>
                      <div className="font-bold text-zinc-850">22 June 2026</div>
                      <span className="text-[10px] text-zinc-400">8:02 AM - 5:05 PM</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Checked In</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-zinc-850">21 June 2026</div>
                      <span className="text-[10px] text-zinc-400">Sunday rest day</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200/50 px-2 py-0.5 rounded-full">Weekend</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
