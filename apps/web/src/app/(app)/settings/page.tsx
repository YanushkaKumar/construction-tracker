'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Settings, Loader2, Building2, Users, Bell, ShieldCheck, 
  CheckCircle2, AlertCircle, Clock, Save, Plus, Trash2, Edit
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  // Fetch company members/users
  const { data: usersData, isLoading: isUsersLoading } = useQuery<{ data: User[] }>({
    queryKey: ['company-users'],
    queryFn: async () => (await apiClient.get('/users')).data,
    enabled: activeTab === 'team',
    retry: 1,
  });

  // Fetch company audit logs
  const { data: auditData, isLoading: isAuditLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard');
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
    queryFn: async () => (await apiClient.get('/users/roles')).data,
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

  const selectStyle = "h-9 rounded-lg border border-border/60 bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-headline text-foreground">Settings</h1>
          <p className="text-caption mt-1">Configure company metadata, team accesses, bot configurations, and audit registries.</p>
        </div>
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/40 p-1 rounded-xl border border-border/40 overflow-x-auto gap-1 w-max">
        {[
          { id: 'company', label: 'Company Profile', icon: Building2 },
          { id: 'team', label: 'Team Accounts', icon: Users },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'audit', label: 'System Audit Logs', icon: Clock }
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
        {activeTab === 'company' && (
          <Card>
            <CardContent className="p-6">
              {saveSuccess && (
                <Alert className="border-success/15 bg-success-subtle text-success mb-4">
                  <CheckCircle2 className="h-4 w-4 text-success" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-caption">Company Name *</Label>
                    <Input id="name" disabled={!isOwner} {...register('name')} />
                    {errors.name && <p className="text-[10px] text-destructive font-medium">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="registrationNo" className="text-caption">Registration Number</Label>
                    <Input id="registrationNo" disabled={!isOwner} {...register('registrationNo')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-caption">Phone Contact</Label>
                    <Input id="phone" disabled={!isOwner} {...register('phone')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-caption">Email Address</Label>
                    <Input id="email" type="email" disabled={!isOwner} {...register('email')} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-caption">Head Office Address</Label>
                  <Input id="address" disabled={!isOwner} {...register('address')} />
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40">
                  {isOwner ? (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                      Save Changes
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">Only the company owner can modify company profile details.</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-label text-muted-foreground/60">Team Accounts & Access</h3>
                  </div>
                  {canManageTeam && (
                    <Button onClick={() => setIsAddMemberOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Team Member
                    </Button>
                  )}
                </div>

                {isUsersLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                    ))}
                  </div>
                ) : companyUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                    <Users className="w-10 h-10 text-muted-foreground/20" />
                    <p className="text-sm font-bold text-foreground">No team members found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Status</th>
                          {canManageTeam && <th className="pb-3 pr-2 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {companyUsers.map((u) => (
                          <tr key={u.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                            <td className="py-3.5 pl-2 font-medium text-foreground">{u.firstName} {u.lastName}</td>
                            <td className="py-3.5 text-muted-foreground">{u.email}</td>
                            <td className="py-3.5">
                              <span className="bg-accent/40 border border-border/30 text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                {u.role.displayName}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`status-dot ${u.isActive ? 'status-active' : 'bg-muted-foreground/30'}`} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{u.isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            {canManageTeam && (
                              <td className="py-3.5 pr-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button 
                                    variant="ghost" 
                                    size="icon-xs"
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
                                    <Edit className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                  {user?.id !== u.id && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-xs"
                                      className="hover:text-danger hover:bg-danger-subtle"
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to deactivate ${u.firstName}?`)) {
                                          deleteMemberMutation.mutate(u.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                  )}
                                </div>
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>Create a new account credentials.</DialogDescription>
                </DialogHeader>
                {addMemberError && <Alert variant="destructive"><AlertDescription>{addMemberError}</AlertDescription></Alert>}
                <div className="space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">First Name *</Label>
                      <Input 
                        placeholder="John" 
                        value={addMemberValues.firstName} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, firstName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-caption">Last Name *</Label>
                      <Input 
                        placeholder="Doe" 
                        value={addMemberValues.lastName} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-caption">Email Address *</Label>
                    <Input 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      value={addMemberValues.email} 
                      onChange={(e) => setAddMemberValues({ ...addMemberValues, email: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label className="text-caption">Password * (Min 8 chars)</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={addMemberValues.password} 
                      onChange={(e) => setAddMemberValues({ ...addMemberValues, password: e.target.value })} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">Phone</Label>
                      <Input 
                        placeholder="+94771234567" 
                        value={addMemberValues.phone} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-caption">Role *</Label>
                      <select 
                        value={addMemberValues.roleId} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, roleId: e.target.value })} 
                        className={selectStyle + ' w-full h-9 font-medium'}
                      >
                        <option value="">Select role...</option>
                        {roles?.map((r) => (
                          <option key={r.id} value={r.id}>{r.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                    <Button 
                      disabled={createMemberMutation.isPending || !addMemberValues.email || !addMemberValues.password || !addMemberValues.firstName || !addMemberValues.lastName || !addMemberValues.roleId}
                      onClick={() => createMemberMutation.mutate(addMemberValues)}
                    >
                      {createMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Create Account'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Team Member Dialog */}
            <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Team Member</DialogTitle>
                  <DialogDescription>Update permissions.</DialogDescription>
                </DialogHeader>
                {editMemberError && <Alert variant="destructive"><AlertDescription>{editMemberError}</AlertDescription></Alert>}
                <div className="space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">First Name *</Label>
                      <Input 
                        placeholder="John" 
                        value={editMemberValues.firstName} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, firstName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-caption">Last Name *</Label>
                      <Input 
                        placeholder="Doe" 
                        value={editMemberValues.lastName} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-caption">Phone</Label>
                      <Input 
                        placeholder="+94771234567" 
                        value={editMemberValues.phone} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-caption">Role *</Label>
                      <select 
                        value={editMemberValues.roleId} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, roleId: e.target.value })} 
                        className={selectStyle + ' w-full h-9 font-medium'}
                      >
                        <option value="">Select role...</option>
                        {roles?.map((r) => (
                          <option key={r.id} value={r.id}>{r.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-xs">
                    <input 
                      type="checkbox" 
                      id="isActive" 
                      checked={editMemberValues.isActive} 
                      onChange={(e) => setEditMemberValues({ ...editMemberValues, isActive: e.target.checked })} 
                      className="w-4 h-4 accent-foreground" 
                    />
                    <Label htmlFor="isActive" className="select-none font-medium text-foreground">Account Active</Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                    <Button variant="outline" onClick={() => setIsEditMemberOpen(false)}>Cancel</Button>
                    <Button 
                      disabled={updateMemberMutation.isPending || !editMemberValues.firstName || !editMemberValues.lastName || !editMemberValues.roleId}
                      onClick={() => updateMemberMutation.mutate({ id: selectedMember?.id || '', values: editMemberValues })}
                    >
                      {updateMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-label text-muted-foreground/60 mb-2">Notification Channels</h3>
              
              <div className="flex items-center justify-between p-4 bg-accent/10 border border-border/30 rounded-xl">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Email Channels</h4>
                  <span className="text-[10px] text-muted-foreground">Receive weekly analytics statements and approval requests.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded border-border" />
              </div>

              <div className="flex items-center justify-between p-4 bg-accent/10 border border-border/30 rounded-xl">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">WhatsApp Broadcaster</h4>
                  <span className="text-[10px] text-muted-foreground">Send dispatch updates to site engineer phones.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded border-border" />
              </div>

              <div className="flex items-center justify-between p-4 bg-accent/10 border border-border/30 rounded-xl">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Telegram Broadcast Bot</h4>
                  <span className="text-[10px] text-muted-foreground">Broadcast safety alerts and weather warning registers.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded border-border" />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-label text-muted-foreground/60 mb-4">System Actions Registry</h3>
              
              {isAuditLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-accent/20 shimmer-bg" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground/20 mb-3" />
                  <p className="text-title text-foreground mb-1">No action records</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground/60 font-semibold uppercase tracking-wider">
                        <th className="pb-3 pl-2">User</th>
                        <th className="pb-3">Action</th>
                        <th className="pb-3">Target Context</th>
                        <th className="pb-3 pr-2">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 pl-2 font-medium text-foreground">{log.user}</td>
                          <td className="py-3.5">
                            <span className="text-[9px] font-bold bg-accent/40 border border-border/30 text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 text-muted-foreground">{log.entityType}</td>
                          <td className="py-3.5 pr-2 text-muted-foreground">
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
