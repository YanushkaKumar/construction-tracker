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
      // Fixed: use dedicated /audit endpoint, not /dashboard
      const response = await apiClient.get('/audit');
      return response.data?.data || response.data?.recentActivities || response.data || [];
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

  const selectStyle = "h-8.5 rounded-xl border border-border/25 bg-background px-3 py-1 text-xs outline-none focus-visible:border-foreground/30 font-semibold";
  const inputStyle = "flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 font-semibold";

  return (
    <div className="space-y-4 pb-12 text-left stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/25 pb-5">
        <div className="text-left select-none">
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-foreground/90">General Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Configure workspace metadata, team access profiles, automated notification loops, and audit logs.</p>
        </div>
      </div>

      {/* Segmented Switcher */}
      <div className="flex bg-accent/25 p-1 rounded-xl border border-border/25 overflow-x-auto gap-1 w-max select-none">
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-card text-foreground border border-border/20 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-1 text-left font-semibold">
        {activeTab === 'company' && (
          <Card className="glass-panel border-border/30 shadow-panel animate-in slide-in-from-bottom-2 duration-300">
            <CardContent className="p-5">
              {saveSuccess && (
                <Alert className="border-success/20 bg-success-subtle/10 text-success rounded-xl mb-4 select-none">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-wider">Success</AlertTitle>
                  <AlertDescription className="text-xs font-semibold">Company details updated successfully!</AlertDescription>
                </Alert>
              )}

              {saveError && (
                <Alert variant="destructive" className="bg-danger-subtle/10 border-danger/25 text-danger-foreground rounded-xl mb-4">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-wider">Error</AlertTitle>
                  <AlertDescription className="text-xs font-semibold">{saveError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onCompanySave)} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-foreground/80">Company Name *</Label>
                    <Input id="name" disabled={!isOwner} {...register('name')} className={inputStyle} />
                    {errors.name && <p className="text-[10px] text-danger font-bold">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="registrationNo" className="text-xs font-semibold text-foreground/80">Registration Number</Label>
                    <Input id="registrationNo" disabled={!isOwner} {...register('registrationNo')} className={inputStyle} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-foreground/80">Phone Contact</Label>
                    <Input id="phone" disabled={!isOwner} {...register('phone')} className={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">Email Address</Label>
                    <Input id="email" type="email" disabled={!isOwner} {...register('email')} className={inputStyle} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold text-foreground/80">Head Office Address</Label>
                  <Input id="address" disabled={!isOwner} {...register('address')} className={inputStyle} />
                </div>

                <div className="flex justify-end pt-4 border-t border-border/15 select-none">
                  {isOwner ? (
                    <Button type="submit" disabled={isSubmitting} className="font-semibold h-10 px-4 rounded-xl text-xs shadow-sm">
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                      Save Changes
                    </Button>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/60 italic font-medium">Only the company owner can modify general company registry profiles.</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <Card className="glass-panel border-border/30 shadow-panel">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 select-none">
                  <div>
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60">Company Roster & Accounts</h3>
                  </div>
                  {canManageTeam && (
                    <Button className="font-semibold h-9 px-3.5 rounded-xl text-xs transition-all shadow-sm" onClick={() => setIsAddMemberOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Team Member
                    </Button>
                  )}
                </div>

                {isUsersLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-accent/15 border border-border/20 shimmer-bg" />
                    ))}
                  </div>
                ) : companyUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center select-none space-y-2">
                    <Users className="w-8 h-8 text-muted-foreground/20 animate-pulse-soft" />
                    <p className="text-xs font-bold text-foreground">No active user registry files found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[15px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[11px] font-mono select-none">
                          <th className="pb-2.5 pl-2">Name</th>
                          <th className="pb-2.5">Email</th>
                          <th className="pb-2.5">Role</th>
                          <th className="pb-2.5">Status</th>
                          {canManageTeam && <th className="pb-2.5 pr-2 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {companyUsers.map((u) => (
                          <tr key={u.id} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                            <td className="py-3 pl-2 text-foreground font-bold">{u.firstName} {u.lastName}</td>
                            <td className="py-3 text-muted-foreground/80 font-mono">{u.email}</td>
                            <td className="py-3">
                              <span className="bg-accent/40 border border-border/25 text-muted-foreground/85 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono select-none">
                                {u.role.displayName}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1.5 select-none">
                                <span className={`status-dot ${u.isActive ? 'status-active' : 'bg-muted-foreground/30'}`} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{u.isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            {canManageTeam && (
                              <td className="py-3 pr-2 text-right select-none">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button 
                                    variant="ghost" 
                                    size="icon-xs"
                                    className="rounded-lg hover:bg-accent/40"
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
                                    <Edit className="w-3.5 h-3.5 text-muted-foreground/75 hover:text-foreground" />
                                  </Button>
                                  {user?.id !== u.id && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-xs"
                                      className="hover:text-danger hover:bg-danger-subtle rounded-lg"
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to deactivate ${u.firstName}?`)) {
                                          deleteMemberMutation.mutate(u.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground/75" />
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
              <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
                <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                  <DialogTitle className="text-sm font-bold text-foreground">Add Team Member</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Create a new corporate personnel login profile.</DialogDescription>
                </DialogHeader>
                {addMemberError && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertDescription className="text-xs">{addMemberError}</AlertDescription></Alert>}
                <div className="space-y-3.5 text-left font-semibold">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">First Name *</Label>
                      <Input 
                        placeholder="John" 
                        value={addMemberValues.firstName} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, firstName: e.target.value })} 
                        className={inputStyle}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Last Name *</Label>
                      <Input 
                        placeholder="Doe" 
                        value={addMemberValues.lastName} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, lastName: e.target.value })} 
                        className={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Email Address *</Label>
                    <Input 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      value={addMemberValues.email} 
                      onChange={(e) => setAddMemberValues({ ...addMemberValues, email: e.target.value })} 
                      className={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Password * (Min 8 chars)</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={addMemberValues.password} 
                      onChange={(e) => setAddMemberValues({ ...addMemberValues, password: e.target.value })} 
                      className={inputStyle}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Phone</Label>
                      <Input 
                        placeholder="+94771234567" 
                        value={addMemberValues.phone} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, phone: e.target.value })} 
                        className={inputStyle}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Role *</Label>
                      <select 
                        value={addMemberValues.roleId} 
                        onChange={(e) => setAddMemberValues({ ...addMemberValues, roleId: e.target.value })} 
                        className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
                      >
                        <option value="">Select role...</option>
                        {roles?.map((r) => (
                          <option key={r.id} value={r.id}>{r.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                    <Button variant="outline" className="rounded-xl h-9 text-xs font-semibold" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                    <Button 
                      className="font-semibold h-9 px-4 rounded-xl text-xs shadow-sm"
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
              <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl p-5 text-left shadow-elevated">
                <DialogHeader className="border-b border-border/15 pb-3.5 mb-3.5">
                  <DialogTitle className="text-sm font-bold text-foreground">Edit Team Member</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">Update authorizations and active statuses.</DialogDescription>
                </DialogHeader>
                {editMemberError && <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl mb-4"><AlertDescription className="text-xs">{editMemberError}</AlertDescription></Alert>}
                <div className="space-y-3.5 text-left font-semibold">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">First Name *</Label>
                      <Input 
                        placeholder="John" 
                        value={editMemberValues.firstName} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, firstName: e.target.value })} 
                        className={inputStyle}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Last Name *</Label>
                      <Input 
                        placeholder="Doe" 
                        value={editMemberValues.lastName} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, lastName: e.target.value })} 
                        className={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Phone</Label>
                      <Input 
                        placeholder="+94771234567" 
                        value={editMemberValues.phone} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, phone: e.target.value })} 
                        className={inputStyle}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Role *</Label>
                      <select 
                        value={editMemberValues.roleId} 
                        onChange={(e) => setEditMemberValues({ ...editMemberValues, roleId: e.target.value })} 
                        className="flex h-10 w-full rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/20 font-semibold"
                      >
                        <option value="">Select role...</option>
                        {roles?.map((r) => (
                          <option key={r.id} value={r.id}>{r.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-xs select-none">
                    <input 
                      type="checkbox" 
                      id="isActive" 
                      checked={editMemberValues.isActive} 
                      onChange={(e) => setEditMemberValues({ ...editMemberValues, isActive: e.target.checked })} 
                      className="w-4 h-4 accent-foreground rounded" 
                    />
                    <Label htmlFor="isActive" className="select-none font-bold text-foreground">Account Active</Label>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/15 select-none">
                    <Button variant="outline" className="rounded-xl h-9 text-xs font-semibold" onClick={() => setIsEditMemberOpen(false)}>Cancel</Button>
                    <Button 
                      className="font-semibold h-9 px-4 rounded-xl text-xs shadow-sm"
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
          <Card className="glass-panel border-border/30 shadow-panel animate-in slide-in-from-bottom-2 duration-300 text-left">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-mono">Notification Channels</h3>
              
              <div className="flex items-center justify-between p-3.5 bg-accent/15 border border-border/20 rounded-xl">
                <div>
                  <h4 className="text-[15px] font-bold text-foreground">Email Channels</h4>
                  <span className="text-[13px] text-muted-foreground font-semibold leading-relaxed">Receive weekly analytics statements and approval requests.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded border-border" />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-accent/15 border border-border/20 rounded-xl">
                <div>
                  <h4 className="text-[15px] font-bold text-foreground">WhatsApp Broadcaster</h4>
                  <span className="text-[13px] text-muted-foreground font-semibold leading-relaxed">Send dispatch updates to site engineer phones.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded border-border" />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-accent/15 border border-border/20 rounded-xl">
                <div>
                  <h4 className="text-[15px] font-bold text-foreground">Telegram Broadcast Bot</h4>
                  <span className="text-[13px] text-muted-foreground font-semibold leading-relaxed">Broadcast safety alerts and weather warning registers.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded border-border" />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card className="glass-panel border-border/30 shadow-panel animate-in slide-in-from-bottom-2 duration-300">
            <CardContent className="p-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-4 select-none font-mono">System Actions Registry</h3>
              
              {isAuditLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-accent/15 border border-border/20 shimmer-bg animate-pulse" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center select-none">
                  <Clock className="w-8 h-8 text-muted-foreground/20 mb-3 animate-pulse-soft" />
                  <p className="text-xs font-bold text-foreground">No action records tracked</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[15px] text-left border-collapse font-semibold">
                    <thead>
                      <tr className="border-b border-border/25 text-muted-foreground/50 font-bold uppercase tracking-wider text-[11px] font-mono select-none">
                        <th className="pb-2.5 pl-2">User</th>
                        <th className="pb-2.5">Action</th>
                        <th className="pb-2.5">Target Context</th>
                        <th className="pb-2.5 pr-2">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-border/15 last:border-0 hover:bg-accent/15 transition-colors">
                          <td className="py-2.5 pl-2 text-foreground font-bold">{log.user}</td>
                          <td className="py-2.5">
                            <span className="text-[10px] font-bold bg-accent/40 border border-border/25 text-muted-foreground px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono select-none">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground/80">{log.entityType}</td>
                          <td className="py-2.5 pr-2 text-muted-foreground/80 font-mono">
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
