// ============================================
// BuildTrack — Shared Constants
// ============================================

export const APP_NAME = 'BuildTrack';
export const DEFAULT_CURRENCY = 'LKR';
export const DEFAULT_TIMEZONE = 'Asia/Colombo';
export const DEFAULT_LOCALE = 'en-LK';

// ── Pagination ──────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── File Upload ─────────────────────────────
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
export const PRESIGNED_URL_EXPIRY = 15 * 60; // 15 minutes in seconds

// ── Weather Conditions ──────────────────────
export const WEATHER_CONDITIONS = [
  'Sunny',
  'Partly Cloudy',
  'Cloudy',
  'Light Rain',
  'Heavy Rain',
  'Thunderstorm',
  'Windy',
  'Hot & Humid',
] as const;

// ── Worker Skill Types ──────────────────────
export const WORKER_SKILL_TYPES = [
  'Mason',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder',
  'Tiler',
  'Labourer',
  'Helper',
  'Driver',
  'Supervisor',
  'Other',
] as const;

// ── Material Categories ─────────────────────
export const MATERIAL_CATEGORIES = [
  'Cement',
  'Steel',
  'Sand',
  'Aggregate',
  'Bricks & Blocks',
  'Timber',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Paint & Finishing',
  'Hardware',
  'Other',
] as const;

// ── Material Units ──────────────────────────
export const MATERIAL_UNITS = [
  'kg',
  'bags',
  'tons',
  'pieces',
  'meters',
  'sq.m',
  'cu.m',
  'liters',
  'feet',
  'bundles',
  'rolls',
  'sheets',
] as const;

// ── Notification Types ──────────────────────
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_OVERDUE: 'TASK_OVERDUE',
  EXPENSE_SUBMITTED: 'EXPENSE_SUBMITTED',
  EXPENSE_APPROVED: 'EXPENSE_APPROVED',
  EXPENSE_REJECTED: 'EXPENSE_REJECTED',
  DAILY_REPORT_SUBMITTED: 'DAILY_REPORT_SUBMITTED',
  MATERIAL_REQUEST_CREATED: 'MATERIAL_REQUEST_CREATED',
  MATERIAL_REQUEST_APPROVED: 'MATERIAL_REQUEST_APPROVED',
  MATERIAL_DELIVERED: 'MATERIAL_DELIVERED',
  WORKER_ADDED: 'WORKER_ADDED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_COMPLETED: 'PROJECT_COMPLETED',
  BUDGET_THRESHOLD: 'BUDGET_THRESHOLD',
} as const;
