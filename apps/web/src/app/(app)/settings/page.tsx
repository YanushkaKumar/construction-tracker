'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Settings, 
  Loader2, 
  Building2, 
  Users, 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Save
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { displayName: string };
  isActive: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  user: string;
  createdAt: string;
}

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  registrationNo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, company, updateCompany } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'notifications' | 'audit'>('company');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch company members/users — the API returns { data: User[], meta: {...} }
  const { data: usersData, isLoading: isUsersLoading } = useQuery<{ data: User[] }>({
    queryKey: ['company-users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
    enabled: activeTab === 'team',
    retry: 1,
  });

  // Fetch company audit logs
  const { data: auditData, isLoading: isAuditLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard'); // dashboard returns audit logs as recentActivities
      return response.data?.recentActivities || [];
    },
    enabled: activeTab === 'audit',
    retry: 1,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const response = await apiClient.patch(`/companies/${company?.id}`, values);
      return response.data;
    },
    onSuccess: (data) => {
      updateCompany(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message || 'Failed to save company settings');
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      registrationNo: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  // Use real API data; fall back to empty arrays (no hardcoded mock data)
  const companyUsers: User[] = usersData?.data || [];
  const auditLogs: AuditLog[] = auditData || [];

  const onCompanySave = (values: any) => {
    setSaveError(null);
    setSaveSuccess(false);
    updateCompanyMutation.mutate(values);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage company information, team accounts, channels and audits.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2 pb-px">
        {[
          { id: 'company', label: 'Company Profile', icon: Building2 },
          { id: 'team', label: 'Team Accounts', icon: Users },
          { id: 'notifications', label: 'Notification Channels', icon: Bell },
          { id: 'audit', label: 'System Audit Logs', icon: Clock }
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

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'company' && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Company Details</CardTitle>
              <CardDescription>Update your construction enterprise details</CardDescription>
            </CardHeader>
            <CardContent>
              {saveSuccess && (
                <Alert className="border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 mb-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>Company details saved successfully!</AlertDescription>
                </Alert>
              )}

              {saveError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onCompanySave)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNo">Registration Number</Label>
                    <Input id="registrationNo" {...register('registrationNo')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Contact</Label>
                    <Input id="phone" {...register('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" {...register('email')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Head Office Address</Label>
                  <Input id="address" {...register('address')} />
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'team' && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Team Accounts & Access</CardTitle>
              <CardDescription>Manage user roles inside your company tenant</CardDescription>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <Users className="w-10 h-10 text-zinc-300" />
                  <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">No team members found</p>
                  <p className="text-xs text-zinc-400">Team members will appear here once users are added to this company.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyUsers.map((u) => (
                        <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{u.firstName} {u.lastName}</td>
                          <td className="py-3.5 text-zinc-500 text-xs">{u.email}</td>
                          <td className="py-3.5">
                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {u.role.displayName}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Toggle messaging alerts for site changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel 1 */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Email Notifications</div>
                  <span className="text-xs text-zinc-400">Receive reports and approvals via email.</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded border-zinc-300" />
                </div>
              </div>

              {/* Channel 2 */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">WhatsApp Alerting</div>
                  <span className="text-xs text-zinc-400">Send dispatch alerts to site engineer phone registers.</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded border-zinc-300" />
                </div>
              </div>

              {/* Channel 3 */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Telegram Bot Channels</div>
                  <span className="text-xs text-zinc-400">Broadcast group updates for safety and weather alerts.</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded border-zinc-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">System Audit Ledger</CardTitle>
              <CardDescription>Live logs of operations performed on database entities</CardDescription>
            </CardHeader>
            <CardContent>
              {isAuditLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <Clock className="w-10 h-10 text-zinc-300" />
                  <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">No audit logs yet</p>
                  <p className="text-xs text-zinc-400">System actions will appear here as you use the platform.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">User</th>
                        <th className="pb-3 font-semibold">Action</th>
                        <th className="pb-3 font-semibold">Entity Type</th>
                        <th className="pb-3 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{log.user}</td>
                          <td className="py-3.5">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 text-zinc-500 text-xs">{log.entityType}</td>
                          <td className="py-3.5 text-zinc-500 text-xs">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
