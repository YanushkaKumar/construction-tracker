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
  Save,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  const isOwner = user?.role === 'COMPANY_OWNER';

  // Fetch full company details from DB
  const { data: fullCompany } = useQuery({
    queryKey: ['company-details'],
    queryFn: async () => {
      const response = await apiClient.get('/company');
      return response.data;
    },
  });

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
      const response = await apiClient.get('/dashboard'); // dashboard returns audit logs as recent activities
      return response.data?.recentActivities || [];
    },
    enabled: activeTab === 'audit',
    retry: 1,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const response = await apiClient.patch('/company', values);
      return response.data;
    },
    onSuccess: (data) => {
      updateCompany(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['company-details'] });
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message || 'Failed to save company settings');
    }
  });

  const {
    register,
    handleSubmit,
    reset,
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

  // Dynamically update form values when DB record is fetched
  React.useEffect(() => {
    if (fullCompany) {
      reset({
        name: fullCompany.name || '',
        registrationNo: fullCompany.registrationNo || '',
        address: fullCompany.address || '',
        phone: fullCompany.phone || '',
        email: fullCompany.email || '',
      });
    }
  }, [fullCompany, reset]);

  // Use real API data; fall back to empty arrays
  const companyUsers: User[] = usersData?.data || [];
  const auditLogs: AuditLog[] = auditData || [];

  const canManageTeam = user?.role === 'COMPANY_OWNER' || user?.role === 'PROJECT_MANAGER';

  // Add Member Dialog state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberValues, setAddMemberValues] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
  });

  // Edit Member Dialog state
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editMemberError, setEditMemberError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [editMemberValues, setEditMemberValues] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    isActive: true,
  });

  // Fetch available roles
  const { data: roles } = useQuery<any[]>({
    queryKey: ['company-roles'],
    queryFn: async () => {
      const response = await apiClient.get('/users/roles');
      return response.data;
    },
    enabled: activeTab === 'team',
  });

  // Mutations
  const createMemberMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await apiClient.post('/users', values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      setIsAddMemberOpen(false);
      setAddMemberValues({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: '' });
      setAddMemberError(null);
    },
    onError: (err: any) => {
      setAddMemberError(err.response?.data?.message || 'Failed to create team member');
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const response = await apiClient.patch(`/users/${id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      setIsEditMemberOpen(false);
      setSelectedMember(null);
      setEditMemberError(null);
    },
    onError: (err: any) => {
      setEditMemberError(err.response?.data?.message || 'Failed to update team member');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  });

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
                <Alert className="border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 mb-4">
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
                    <Input id="name" disabled={!isOwner} {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNo">Registration Number</Label>
                    <Input id="registrationNo" disabled={!isOwner} {...register('registrationNo')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Contact</Label>
                    <Input id="phone" disabled={!isOwner} {...register('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" disabled={!isOwner} {...register('email')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Head Office Address</Label>
                  <Input id="address" disabled={!isOwner} {...register('address')} />
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {isOwner ? (
                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">Only the company owner can modify company profile details.</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Team Accounts & Access</CardTitle>
                  <CardDescription>Manage user roles inside your company tenant</CardDescription>
                </div>
                {canManageTeam && (
                  <Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs" onClick={() => setIsAddMemberOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Team Member
                  </Button>
                )}
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
                          {canManageTeam && <th className="pb-3 font-semibold text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {companyUsers.map((u) => (
                          <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{u.firstName} {u.lastName}</td>
                            <td className="py-3.5 text-zinc-500 text-xs">{u.email}</td>
                            <td className="py-3.5">
                              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                {u.role.displayName}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${u.isActive ? 'text-emerald-600 bg-emerald-500/10' : 'text-zinc-400 bg-zinc-100'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {canManageTeam && (
                              <td className="py-3.5 text-right space-x-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-zinc-400 hover:text-zinc-800"
                                  onClick={() => {
                                    setSelectedMember(u);
                                    setEditMemberValues({
                                      firstName: u.firstName,
                                      lastName: u.lastName,
                                      phone: (u as any).phone || '',
                                      roleId: (u as any).roleId || (u as any).role?.id || '',
                                      isActive: u.isActive,
                                    });
                                    setEditMemberError(null);
                                    setIsEditMemberOpen(true);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                {user?.id !== u.id && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-rose-400 hover:text-rose-600"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove or deactivate ${u.firstName}?`)) {
                                        deleteMemberMutation.mutate(u.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Team Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>Create a new account and assign permissions.</DialogDescription>
                </DialogHeader>
                {addMemberError && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{addMemberError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">First Name *</Label>
                      <Input 
                        placeholder="John" 
                        value={addMemberValues.firstName} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, firstName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name *</Label>
                      <Input 
                        placeholder="Doe" 
                        value={addMemberValues.lastName} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email Address *</Label>
                    <Input 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      value={addMemberValues.email} 
                      onChange={(e) => setAddMemberValues({ ...addMemberValues, email: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Password * (Min 8 chars)</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={addMemberValues.password} 
                      onChange={(e) => setAddMemberValues({ ...addMemberValues, password: e.target.value })} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input 
                        placeholder="+94771234567" 
                        value={addMemberValues.phone} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Role *</Label>
                      <select 
                        value={addMemberValues.roleId} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, roleId: e.target.value })} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        <option value="">Select role...</option>
                        {roles?.map((r) => (
                          <option key={r.id} value={r.id}>{r.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                      disabled={createMemberMutation.isPending || !addMemberValues.email || !addMemberValues.password || !addMemberValues.firstName || !addMemberValues.lastName || !addMemberValues.roleId}
                      onClick={() => createMemberMutation.mutate(addMemberValues)}
                    >
                      {createMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Account'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Team Member Dialog */}
            <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Team Member</DialogTitle>
                  <DialogDescription>Update profile details or permissions.</DialogDescription>
                </DialogHeader>
                {editMemberError && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{editMemberError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">First Name *</Label>
                      <Input 
                        placeholder="John" 
                        value={editMemberValues.firstName} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, firstName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name *</Label>
                      <Input 
                        placeholder="Doe" 
                        value={editMemberValues.lastName} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input 
                        placeholder="+94771234567" 
                        value={editMemberValues.phone} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Role *</Label>
                      <select 
                        value={editMemberValues.roleId} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, roleId: e.target.value })} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        <option value="">Select role...</option>
                        {roles?.map((r) => (
                          <option key={r.id} value={r.id}>{r.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isActive" 
                      checked={editMemberValues.isActive} 
                      onChange={(e) => setEditMemberValues({ ...editMemberValues, isActive: e.target.checked })} 
                      className="w-4 h-4 accent-amber-500" 
                    />
                    <Label htmlFor="isActive" className="text-xs select-none">Account Active</Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => setIsEditMemberOpen(false)}>Cancel</Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                      disabled={updateMemberMutation.isPending || !editMemberValues.firstName || !editMemberValues.lastName || !editMemberValues.roleId}
                      onClick={() => updateMemberMutation.mutate({ id: selectedMember?.id || '', values: editMemberValues })}
                    >
                      {updateMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
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
