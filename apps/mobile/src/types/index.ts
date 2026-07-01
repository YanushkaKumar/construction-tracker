export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  location?: string;
  budgetEstimate: number;
  status: string;
  priority: string;
  progressPercent?: number;
  startDate?: string;
  endDate?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleDisplayName: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  user: string;
  createdAt: string;
}

export interface UserMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: { id: string; name: string; displayName: string };
  roleId: string;
  isActive: boolean;
}

export interface ProjectFinance {
  id: string;
  name: string;
  code: string;
  budgetEstimate: number;
  totalAdvance: number;
  totalSpent: number;
  balance: number;
}

export interface AdvanceRecord {
  id: string;
  amount: number;
  description: string;
  referenceNo?: string;
  receivedDate: string;
  project?: { code: string; name: string };
}

export interface PurchaseRecord {
  id: string;
  title: string;
  totalAmount: number;
  category: string;
  purchaseDate: string;
  vendor?: string;
  allocations: Array<{
    id: string;
    amount: number;
    project?: { code: string };
  }>;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
  assignee?: { id: string; firstName: string; lastName: string };
  project?: { id: string; name: string; code: string };
}

export interface DailyLog {
  id: string;
  projectId: string;
  reportDate: string;
  weatherCondition?: string;
  workSummary: string;
  issues?: string;
  safetyNotes?: string;
  workersOnSite: number;
  notes?: string;
  reporter?: { id: string; firstName: string; lastName: string };
  project?: { code: string; name: string };
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  category?: string;
  minimumStock: number;
  currentStock: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  materialTypes: string[];
  rating?: number;
  isActive: boolean;
}

export interface MaterialRequest {
  id: string;
  projectId: string;
  materialId: string;
  supplierId?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status: 'PENDING' | 'APPROVED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  material: { name: string; unit: string };
  project?: { name: string; code: string };
  supplier?: { name: string };
}

export interface Expense {
  id: string;
  projectId: string;
  category: 'LABOUR' | 'MATERIAL' | 'EQUIPMENT' | 'TRANSPORT' | 'SUBCONTRACTOR' | 'MISCELLANEOUS';
  title: string;
  description?: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  expenseDate: string;
  submittedBy?: { firstName: string; lastName: string };
  project?: { name: string; code: string };
}

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  nic?: string;
  phone?: string;
  skillType?: string;
  dailyRate: number;
  isActive: boolean;
}

export interface PayrollRecord {
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

export interface BudgetVsActualData {
  id: string;
  name: string;
  code: string;
  budgetEstimate: number;
  budgetActual: number;
}

export interface ExpenseBreakdownData {
  category: string;
  total: number;
}

export interface ProgressData {
  id: string;
  name: string;
  code: string;
  progressPercent: number;
  startDate?: string;
  endDate?: string;
}
