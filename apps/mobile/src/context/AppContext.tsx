import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { themeColors, getThemedStyles, ThemeColorsType } from '../theme';
import { createApiClient } from '../services/api';
import {
  Project,
  UserInfo,
  CompanyInfo,
  AuditLog,
  UserMember,
  ProjectFinance,
  AdvanceRecord,
  PurchaseRecord,
  Task,
  DailyLog,
  Material,
  Supplier,
  MaterialRequest,
  Expense,
  Worker,
  PayrollRecord,
  BudgetVsActualData,
  ExpenseBreakdownData,
  ProgressData,
} from '../types';

interface AppContextType {
  // Theme & Styles
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  activeColors: ThemeColorsType;
  styles: any;
  isTablet: boolean;

  // Connection & Auth States
  apiHost: string;
  setApiHost: (host: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  company: CompanyInfo | null;
  setCompany: (company: CompanyInfo | null) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  handleLogin: () => Promise<void>;
  handleLogout: () => void;

  // Navigation State
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  selectedProjectDetailId: string | null;
  setSelectedProjectDetailId: (id: string | null) => void;
  projectDetailSubTab: 'info' | 'tasks' | 'logs' | 'finance' | 'team';
  setProjectDetailSubTab: (tab: 'info' | 'tasks' | 'logs' | 'finance' | 'team') => void;

  // Master Data
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  auditLogs: AuditLog[];
  dashboardStats: any;
  financeOverview: any;
  advances: AdvanceRecord[];
  purchases: PurchaseRecord[];
  teamMembers: UserMember[];
  roles: any[];
  dataLoading: boolean;

  // Filters & Sub states
  tasks: Task[];
  taskFilterProjectId: string;
  setTaskFilterProjectId: (id: string) => void;
  selectedKanbanStatus: string;
  setSelectedKanbanStatus: (status: string) => void;
  dailyLogs: DailyLog[];
  dailyLogsFilterProjectId: string;
  setDailyLogsFilterProjectId: (id: string) => void;
  materialsTab: 'requests' | 'inventory' | 'suppliers';
  setMaterialsTab: (tab: 'requests' | 'inventory' | 'suppliers') => void;
  materialRequests: MaterialRequest[];
  materialsCatalog: Material[];
  suppliers: Supplier[];
  materialsFilterProjectId: string;
  setMaterialsFilterProjectId: (id: string) => void;
  financeSubTab: 'overview' | 'advances' | 'purchases' | 'approvals';
  setFinanceSubTab: (tab: 'overview' | 'advances' | 'purchases' | 'approvals') => void;
  pendingExpenses: Expense[];
  workersTab: 'roster' | 'attendance' | 'payroll';
  setWorkersTab: (tab: 'roster' | 'attendance' | 'payroll') => void;
  workersList: Worker[];
  attendanceProjectId: string;
  setAttendanceProjectId: (id: string) => void;
  attendanceDate: string;
  setAttendanceDate: (date: string) => void;
  attendanceRecords: Record<string, { status: string; overtime: number }>;
  setAttendanceRecords: (records: Record<string, { status: string; overtime: number }>) => void;
  payrollStart: string;
  setPayrollStart: (date: string) => void;
  payrollEnd: string;
  setPayrollEnd: (date: string) => void;
  payrollSummary: PayrollRecord[];
  reportsTab: 'financials' | 'expenses' | 'progress';
  setReportsTab: (tab: 'financials' | 'expenses' | 'progress') => void;
  reportProjectId: string;
  setReportProjectId: (id: string) => void;
  reportBudgets: BudgetVsActualData[];
  reportExpenses: ExpenseBreakdownData[];
  reportProgress: ProgressData[];

  // API Client Getter
  getClient: () => any;

  // Global Actions
  refreshData: () => Promise<void>;
  handleUpdateCompany: (companyName: string) => Promise<boolean>;
  handleCreateProject: (values: any) => Promise<boolean>;
  handleUpdateProject: (projectId: string, values: any) => Promise<boolean>;
  handleRecordAdvance: (projectId: string, amount: number, description: string, referenceNo?: string, notes?: string) => Promise<boolean>;
  handleLogPurchase: (values: { title: string; totalAmount: number; category: string; vendor?: string; description?: string; allocations: Array<{ projectId: string; amount: number }> }) => Promise<boolean>;
  handleAddUser: (values: any) => Promise<boolean>;
  handleEditUser: (userId: string, values: any) => Promise<boolean>;
  handleDeleteUser: (userId: string, name: string) => void;
  handleCreateTask: (values: { projectId: string; title: string; description?: string; priority: string; status: string; assigneeId?: string; dueDate?: string }) => Promise<boolean>;
  handleUpdateTask: (taskId: string, values: { title: string; description?: string; priority: string; status: string; assigneeId?: string; dueDate?: string }) => Promise<boolean>;
  handleUpdateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => void;
  handleCreateDailyLog: (projectId: string, values: any) => Promise<boolean>;
  handleCreateMaterialRequest: (projectId: string, values: any) => Promise<boolean>;
  handleUpdateMaterialRequestStatus: (requestId: string, newStatus: string) => Promise<void>;
  handleApproveExpense: (expenseId: string) => Promise<void>;
  handleRejectExpense: (expenseId: string, reason: string) => Promise<boolean>;
  handleRegisterWorker: (values: any) => Promise<boolean>;
  handleSaveAttendance: () => Promise<void>;

  // Formatting helpers
  fmt: (n: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth > 600;
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const activeColors = themeColors[theme];
  const styles = StyleSheet.create(getThemedStyles(activeColors, isTablet));

  // Connection & Auth States
  const [apiHost, setApiHost] = useState('http://192.168.1.166:4000/api/v1');
  const [email, setEmail] = useState('owner@lankabuild.lk');
  const [password, setPassword] = useState('BuildTrack@2026');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation State
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [selectedProjectDetailId, setSelectedProjectDetailId] = useState<string | null>(null);
  const [projectDetailSubTab, setProjectDetailSubTab] = useState<'info' | 'tasks' | 'logs' | 'finance' | 'team'>('info');

  // Master Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [financeOverview, setFinanceOverview] = useState<any>(null);
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserMember[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Filters & Sub states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilterProjectId, setTaskFilterProjectId] = useState<string>('');
  const [selectedKanbanStatus, setSelectedKanbanStatus] = useState<string>('TODO');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [dailyLogsFilterProjectId, setDailyLogsFilterProjectId] = useState<string>('');
  const [materialsTab, setMaterialsTab] = useState<'requests' | 'inventory' | 'suppliers'>('requests');
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [materialsCatalog, setMaterialsCatalog] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materialsFilterProjectId, setMaterialsFilterProjectId] = useState<string>('');
  const [financeSubTab, setFinanceSubTab] = useState<'overview' | 'advances' | 'purchases' | 'approvals'>('overview');
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [workersTab, setWorkersTab] = useState<'roster' | 'attendance' | 'payroll'>('roster');
  const [workersList, setWorkersList] = useState<Worker[]>([]);
  const [attendanceProjectId, setAttendanceProjectId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string; overtime: number }>>({});
  const [payrollStart, setPayrollStart] = useState<string>(new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]);
  const [payrollEnd, setPayrollEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollRecord[]>([]);
  const [reportsTab, setReportsTab] = useState<'financials' | 'expenses' | 'progress'>('financials');
  const [reportProjectId, setReportProjectId] = useState<string>('ALL');
  const [reportBudgets, setReportBudgets] = useState<BudgetVsActualData[]>([]);
  const [reportExpenses, setReportExpenses] = useState<ExpenseBreakdownData[]>([]);
  const [reportProgress, setReportProgress] = useState<ProgressData[]>([]);

  const isAuthorizer = user?.role === 'COMPANY_OWNER' || user?.role === 'PROJECT_MANAGER' || user?.role === 'ACCOUNTANT';

  // Axios Client getter
  const getClient = () => {
    return createApiClient(apiHost, token);
  };

  // Auth Action
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all credentials');
      return;
    }
    setAuthLoading(true);
    try {
      const response = await getClient().post('/auth/login', { email, password });
      const { accessToken, user: loggedUser, company: loggedCompany } = response.data;
      setToken(accessToken);
      setUser(loggedUser);
      setCompany(loggedCompany);
      setActiveScreen('dashboard');
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || '';
      const detailMsg = serverMsg
        ? `${serverMsg}\n\nPlease check credentials and API host.`
        : 'Could not connect to server. Please check configurations.';
      Alert.alert('Login Failed', detailMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCompany(null);
    setActiveScreen('dashboard');
  };

  // Company profile update
  const handleUpdateCompany = async (companyName: string) => {
    try {
      const response = await getClient().patch('/company', { name: companyName });
      setCompany(response.data);
      Alert.alert('Success', 'Company profile updated successfully');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update company profile');
      return false;
    }
  };

  // Project CRUD Actions
  const handleCreateProject = async (values: any) => {
    try {
      await getClient().post('/projects', values);
      Alert.alert('Success', 'Project created successfully');
      await refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create project');
      return false;
    }
  };

  const handleUpdateProject = async (projectId: string, values: any) => {
    try {
      await getClient().patch(`/projects/${projectId}`, values);
      Alert.alert('Success', 'Project details updated');
      if (selectedProjectDetailId === projectId) {
        setSelectedProjectDetailId(null);
        setTimeout(() => setSelectedProjectDetailId(projectId), 10);
      }
      await refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update project');
      return false;
    }
  };

  // API Fetch Functions
  const fetchDashboardData = async () => {
    try {
      const client = getClient();
      const [dbRes, projRes] = await Promise.all([
        client.get('/dashboard'),
        client.get('/projects'),
      ]);
      setDashboardStats(dbRes.data);
      setAuditLogs(dbRes.data?.recentActivities || []);
      setProjects(projRes.data?.data || []);
      if (projRes.data?.data && projRes.data.data.length > 0) {
        if (!attendanceProjectId) setAttendanceProjectId(projRes.data.data[0].id);
        if (!dailyLogsFilterProjectId) setDailyLogsFilterProjectId(projRes.data.data[0].id);
        if (!materialsFilterProjectId) setMaterialsFilterProjectId(projRes.data.data[0].id);
      }
    } catch (e) {
      console.warn('Dashboard fetch error', e);
    }
  };

  const fetchTasks = async (projId?: string) => {
    try {
      const client = getClient();
      const targetProjId = projId || taskFilterProjectId;
      if (targetProjId) {
        const response = await client.get(`/projects/${targetProjId}/tasks`);
        setTasks(response.data || []);
      } else {
        const list: Task[] = [];
        for (const p of projects) {
          try {
            const res = await client.get(`/projects/${p.id}/tasks`);
            const projectTasks = (res.data || []).map((t: any) => ({
              ...t,
              project: { id: p.id, name: p.name, code: p.code },
            }));
            list.push(...projectTasks);
          } catch (e) {}
        }
        setTasks(list);
      }
    } catch (e) {
      console.warn('Tasks fetch error', e);
    }
  };

  const fetchDailyLogs = async (projId?: string) => {
    try {
      const client = getClient();
      const targetProjId = projId || dailyLogsFilterProjectId;
      if (targetProjId) {
        const response = await client.get(`/projects/${targetProjId}/daily-reports`);
        setDailyLogs(response.data?.data || response.data || []);
      } else {
        setDailyLogs([]);
      }
    } catch (e) {
      console.warn('Daily reports fetch error', e);
    }
  };

  const fetchMaterialsData = async () => {
    try {
      const client = getClient();
      const [matRes, supRes] = await Promise.all([
        client.get('/materials'),
        client.get('/suppliers'),
      ]);
      setMaterialsCatalog(matRes.data || []);
      setSuppliers(supRes.data || []);

      const targetProjId = materialsFilterProjectId;
      if (targetProjId) {
        const reqRes = await client.get(`/projects/${targetProjId}/material-requests`);
        setMaterialRequests(reqRes.data || []);
      } else {
        setMaterialRequests([]);
      }
    } catch (e) {
      console.warn('Materials fetch error', e);
    }
  };

  const fetchFinanceData = async () => {
    try {
      const client = getClient();
      const [ovRes, advRes, purRes] = await Promise.all([
        client.get('/finance/overview'),
        client.get('/advances'),
        client.get('/purchases'),
      ]);
      setFinanceOverview(ovRes.data);
      setAdvances(advRes.data || []);
      setPurchases(purRes.data || []);

      if (isAuthorizer) {
        const pendingRes = await client.get('/expenses/pending');
        setPendingExpenses(pendingRes.data || []);
      }
    } catch (e) {
      console.warn('Finance fetch error', e);
    }
  };

  const fetchWorkersData = async () => {
    try {
      const client = getClient();
      const response = await client.get('/workers');
      setWorkersList(response.data || []);

      const payrollRes = await client.get(
        `/workers/payroll-summary?startDate=${payrollStart}&endDate=${payrollEnd}`
      );
      setPayrollSummary(payrollRes.data || []);
    } catch (e) {
      console.warn('Workers fetch error', e);
    }
  };

  const fetchReportsData = async () => {
    try {
      const client = getClient();
      const [budRes, progressRes] = await Promise.all([
        client.get('/reports/budget-vs-actual'),
        client.get('/reports/progress'),
      ]);
      setReportBudgets(budRes.data || []);
      setReportProgress(progressRes.data || []);

      const url =
        reportProjectId === 'ALL'
          ? '/reports/expenses'
          : `/reports/expenses?projectId=${reportProjectId}`;
      const expRes = await client.get(url);
      setReportExpenses(expRes.data || []);
    } catch (e) {
      console.warn('Reports fetch error', e);
    }
  };

  const fetchSettingsData = async () => {
    try {
      const client = getClient();
      const [usersRes, rolesRes, companyRes] = await Promise.all([
        client.get('/users'),
        client.get('/users/roles'),
        client.get('/company'),
      ]);
      setTeamMembers(usersRes.data?.data || []);
      setRoles(rolesRes.data || []);
      if (companyRes.data) {
        setCompany(companyRes.data);
      }
    } catch (e) {
      console.warn('Settings fetch error', e);
    }
  };

  const refreshData = async () => {
    if (!token) return;
    setDataLoading(true);
    await fetchDashboardData();

    if (activeScreen === 'tasks') {
      await fetchTasks();
    } else if (activeScreen === 'daily-logs') {
      await fetchDailyLogs();
    } else if (activeScreen === 'materials') {
      await fetchMaterialsData();
    } else if (activeScreen === 'finance') {
      await fetchFinanceData();
    } else if (activeScreen === 'workers') {
      await fetchWorkersData();
    } else if (activeScreen === 'reports') {
      await fetchReportsData();
    } else if (activeScreen === 'settings') {
      await fetchSettingsData();
    } else if (activeScreen === 'project-detail' && selectedProjectDetailId) {
      await fetchTasks(selectedProjectDetailId);
      await fetchDailyLogs(selectedProjectDetailId);
      try {
        const reqRes = await getClient().get(`/projects/${selectedProjectDetailId}/material-requests`);
        setMaterialRequests(reqRes.data || []);
      } catch (e) {}
    }
    setDataLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [
    token,
    activeScreen,
    selectedProjectDetailId,
    taskFilterProjectId,
    dailyLogsFilterProjectId,
    materialsFilterProjectId,
    reportProjectId,
    payrollStart,
    payrollEnd,
  ]);

  // Finance Actions
  const handleRecordAdvance = async (
    projectId: string,
    amount: number,
    description: string,
    referenceNo?: string,
    notes?: string
  ) => {
    try {
      await getClient().post(`/projects/${projectId}/advances`, {
        amount,
        description,
        referenceNo: referenceNo || undefined,
        receivedDate: new Date().toISOString().split('T')[0],
        notes: notes || undefined,
      });
      fetchFinanceData();
      Alert.alert('Success', 'Project advance recorded successfully');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record advance');
      return false;
    }
  };

  const handleLogPurchase = async (values: {
    title: string;
    totalAmount: number;
    category: string;
    vendor?: string;
    description?: string;
    allocations: Array<{ projectId: string; amount: number }>;
  }) => {
    try {
      await getClient().post('/purchases', {
        ...values,
        purchaseDate: new Date().toISOString().split('T')[0],
      });
      fetchFinanceData();
      Alert.alert('Success', 'Purchase logged successfully');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to log purchase');
      return false;
    }
  };

  // Team Actions
  const handleAddUser = async (values: any) => {
    try {
      await getClient().post('/users', values);
      fetchSettingsData();
      Alert.alert('Success', 'Team member created successfully');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create user');
      return false;
    }
  };

  const handleEditUser = async (userId: string, values: any) => {
    try {
      await getClient().patch(`/users/${userId}`, values);
      fetchSettingsData();
      Alert.alert('Success', 'Team member updated successfully');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user');
      return false;
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to deactivate or remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await getClient().delete(`/users/${userId}`);
              fetchSettingsData();
              Alert.alert('Removed', 'User deactivated/removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  // Tasks CRUD
  const handleCreateTask = async (values: any) => {
    try {
      await getClient().post(`/projects/${values.projectId}/tasks`, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        status: values.status,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
      });
      Alert.alert('Success', 'Task created successfully');
      refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create task');
      return false;
    }
  };

  const handleUpdateTask = async (taskId: string, values: any) => {
    try {
      await getClient().patch(`/tasks/${taskId}`, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        status: values.status,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
      });
      Alert.alert('Success', 'Task updated successfully');
      refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update task');
      return false;
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await getClient().patch(`/tasks/${taskId}/status`, { status: newStatus });
      refreshData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await getClient().delete(`/tasks/${taskId}`);
              Alert.alert('Deleted', 'Task removed');
              refreshData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  // Daily Site Report
  const handleCreateDailyLog = async (projectId: string, values: any) => {
    try {
      await getClient().post(`/projects/${projectId}/daily-reports`, values);
      Alert.alert('Success', 'Daily site log submitted');
      refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit log');
      return false;
    }
  };

  // Material requests
  const handleCreateMaterialRequest = async (projectId: string, values: any) => {
    try {
      await getClient().post(`/projects/${projectId}/material-requests`, values);
      Alert.alert('Success', 'Procurement requisition submitted');
      refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request materials');
      return false;
    }
  };

  const handleUpdateMaterialRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await getClient().patch(`/material-requests/${requestId}/status`, { status: newStatus });
      refreshData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update request status');
    }
  };

  // Expense approval
  const handleApproveExpense = async (expenseId: string) => {
    try {
      await getClient().post(`/expenses/${expenseId}/approve`);
      Alert.alert('Approved', 'Expense voucher approved.');
      refreshData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve expense');
    }
  };

  const handleRejectExpense = async (expenseId: string, reason: string) => {
    try {
      await getClient().post(`/expenses/${expenseId}/reject`, { reason });
      Alert.alert('Rejected', 'Expense voucher has been rejected.');
      refreshData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject expense');
      return false;
    }
  };

  // Workers
  const handleRegisterWorker = async (values: any) => {
    try {
      await getClient().post('/workers', values);
      Alert.alert('Success', 'Worker profile added to roster');
      fetchWorkersData();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to register worker');
      return false;
    }
  };

  const handleSaveAttendance = async () => {
    const targetProjId = attendanceProjectId || projects[0]?.id;
    if (!targetProjId) {
      Alert.alert('Error', 'Please select a project first.');
      return;
    }
    const records = workersList.map((w) => ({
      workerId: w.id,
      status: attendanceRecords[w.id]?.status || 'ABSENT',
      overtimeHours: attendanceRecords[w.id]?.overtime || 0,
      date: attendanceDate,
    }));
    try {
      await getClient().post(`/projects/${targetProjId}/attendance`, { records });
      Alert.alert('Success', 'Attendance register logged successfully');
      refreshData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save attendance register');
    }
  };

  // Formatting helpers
  const fmt = (n: number) => {
    if (!n) return 'LKR 0';
    if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
    return `LKR ${n.toLocaleString()}`;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        activeColors,
        styles,
        isTablet,

        apiHost,
        setApiHost,
        email,
        setEmail,
        password,
        setPassword,
        token,
        setToken,
        user,
        setUser,
        company,
        setCompany,
        authLoading,
        setAuthLoading,
        handleLogin,
        handleLogout,

        activeScreen,
        setActiveScreen,
        selectedProjectDetailId,
        setSelectedProjectDetailId,
        projectDetailSubTab,
        setProjectDetailSubTab,

        projects,
        setProjects,
        auditLogs,
        dashboardStats,
        financeOverview,
        advances,
        purchases,
        teamMembers,
        roles,
        dataLoading,

        tasks,
        taskFilterProjectId,
        setTaskFilterProjectId,
        selectedKanbanStatus,
        setSelectedKanbanStatus,
        dailyLogs,
        dailyLogsFilterProjectId,
        setDailyLogsFilterProjectId,
        materialsTab,
        setMaterialsTab,
        materialRequests,
        materialsCatalog,
        suppliers,
        materialsFilterProjectId,
        setMaterialsFilterProjectId,
        financeSubTab,
        setFinanceSubTab,
        pendingExpenses,
        workersTab,
        setWorkersTab,
        workersList,
        attendanceProjectId,
        setAttendanceProjectId,
        attendanceDate,
        setAttendanceDate,
        attendanceRecords,
        setAttendanceRecords,
        payrollStart,
        setPayrollStart,
        payrollEnd,
        setPayrollEnd,
        payrollSummary,
        reportsTab,
        setReportsTab,
        reportProjectId,
        setReportProjectId,
        reportBudgets,
        reportExpenses,
        reportProgress,

        getClient,
        refreshData,
        handleUpdateCompany,
        handleCreateProject,
        handleUpdateProject,
        handleRecordAdvance,
        handleLogPurchase,
        handleAddUser,
        handleEditUser,
        handleDeleteUser,
        handleCreateTask,
        handleUpdateTask,
        handleUpdateTaskStatus,
        handleDeleteTask,
        handleCreateDailyLog,
        handleCreateMaterialRequest,
        handleUpdateMaterialRequestStatus,
        handleApproveExpense,
        handleRejectExpense,
        handleRegisterWorker,
        handleSaveAttendance,

        fmt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
