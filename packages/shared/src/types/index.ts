// ============================================
// BuildTrack — Shared Type Definitions
// ============================================

// ── Enums ───────────────────────────────────

export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ExpenseCategory {
  LABOUR = 'LABOUR',
  MATERIAL = 'MATERIAL',
  EQUIPMENT = 'EQUIPMENT',
  TRANSPORT = 'TRANSPORT',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  MISCELLANEOUS = 'MISCELLANEOUS',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum MaterialRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  IN_APP = 'IN_APP',
}

// ── System Roles ────────────────────────────

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_OWNER = 'COMPANY_OWNER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SITE_ENGINEER = 'SITE_ENGINEER',
  QUANTITY_SURVEYOR = 'QUANTITY_SURVEYOR',
  ACCOUNTANT = 'ACCOUNTANT',
  WORKER = 'WORKER',
}

// ── Permissions ─────────────────────────────

export enum Permission {
  // Company
  COMPANY_MANAGE = 'company:manage',
  COMPANY_VIEW = 'company:view',

  // Users
  USERS_MANAGE = 'users:manage',
  USERS_VIEW = 'users:view',

  // Projects
  PROJECTS_CREATE = 'projects:create',
  PROJECTS_MANAGE_ALL = 'projects:manage_all',
  PROJECTS_MANAGE_ASSIGNED = 'projects:manage_assigned',
  PROJECTS_VIEW = 'projects:view',

  // Tasks
  TASKS_CREATE = 'tasks:create',
  TASKS_ASSIGN = 'tasks:assign',
  TASKS_UPDATE_STATUS = 'tasks:update_status',
  TASKS_VIEW = 'tasks:view',

  // Daily Reports
  DAILY_REPORTS_SUBMIT = 'daily_reports:submit',
  DAILY_REPORTS_VIEW = 'daily_reports:view',

  // Materials
  MATERIALS_MANAGE = 'materials:manage',
  MATERIALS_VIEW = 'materials:view',

  // Expenses
  EXPENSES_SUBMIT = 'expenses:submit',
  EXPENSES_APPROVE = 'expenses:approve',
  EXPENSES_VIEW_ALL = 'expenses:view_all',
  EXPENSES_VIEW_OWN = 'expenses:view_own',

  // Workers
  WORKERS_MANAGE = 'workers:manage',
  WORKERS_VIEW = 'workers:view',

  // Attendance
  ATTENDANCE_MARK = 'attendance:mark',
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_VIEW_OWN = 'attendance:view_own',

  // Reports
  REPORTS_FINANCIAL = 'reports:financial',
  REPORTS_PROGRESS = 'reports:progress',
  REPORTS_LABOUR = 'reports:labour',

  // Notifications
  NOTIFICATIONS_MANAGE = 'notifications:manage',
}

// ── Role → Permission Mapping ───────────────

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.SUPER_ADMIN]: Object.values(Permission),

  [SystemRole.COMPANY_OWNER]: [
    Permission.COMPANY_MANAGE,
    Permission.COMPANY_VIEW,
    Permission.USERS_MANAGE,
    Permission.USERS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_MANAGE_ALL,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_CREATE,
    Permission.TASKS_ASSIGN,
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_APPROVE,
    Permission.EXPENSES_VIEW_ALL,
    Permission.WORKERS_MANAGE,
    Permission.WORKERS_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_PROGRESS,
    Permission.REPORTS_LABOUR,
    Permission.NOTIFICATIONS_MANAGE,
  ],

  [SystemRole.PROJECT_MANAGER]: [
    Permission.COMPANY_VIEW,
    Permission.USERS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_MANAGE_ASSIGNED,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_CREATE,
    Permission.TASKS_ASSIGN,
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_APPROVE,
    Permission.EXPENSES_VIEW_ALL,
    Permission.WORKERS_MANAGE,
    Permission.WORKERS_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.REPORTS_PROGRESS,
    Permission.REPORTS_LABOUR,
  ],

  [SystemRole.SITE_ENGINEER]: [
    Permission.COMPANY_VIEW,
    Permission.PROJECTS_MANAGE_ASSIGNED,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_CREATE,
    Permission.TASKS_ASSIGN,
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_SUBMIT,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_VIEW_OWN,
    Permission.WORKERS_MANAGE,
    Permission.WORKERS_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.ATTENDANCE_VIEW,
  ],

  [SystemRole.QUANTITY_SURVEYOR]: [
    Permission.COMPANY_VIEW,
    Permission.PROJECTS_MANAGE_ASSIGNED,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_VIEW_ALL,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_PROGRESS,
  ],

  [SystemRole.ACCOUNTANT]: [
    Permission.COMPANY_VIEW,
    Permission.PROJECTS_VIEW,
    Permission.EXPENSES_APPROVE,
    Permission.EXPENSES_VIEW_ALL,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_LABOUR,
  ],

  [SystemRole.WORKER]: [
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.ATTENDANCE_VIEW_OWN,
  ],
};

// ── API Response Types ──────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
