/**
 * Anything whose name looks like a credential never reaches the trail. The
 * interceptor stores raw request bodies, and those bodies include the password
 * on user create and on a password change.
 */
const SECRET_KEY =
  /password|passphrase|passcode|token|secret|credential|apikey|api_?key|signature|authorization|^otp$|^pin$/i;

/** Values that are large but say nothing: base64 uploads, long blobs. */
const MAX_STRING = 500;

export const REDACTED = '[redacted]';

/**
 * Keys the interceptor adds for the reading UI. They live inside `changes`
 * rather than in their own columns so that the audit table's schema is
 * untouched — production is live and gets no DDL for a reporting feature.
 */
export const META_KEY = '_meta';

export function redactSecrets(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 6) return '[deep]';

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redactSecrets(v, depth + 1));
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }

  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEY.test(key) ? REDACTED : redactSecrets(val, depth + 1);
  }
  return out;
}

/** Fields that tend to carry the human name of a record, best first. */
const LABEL_FIELDS = [
  'name',
  'title',
  'projectName',
  'fullName',
  'invoiceNo',
  'referenceNo',
  'requestNumber',
  'poNumber',
  'supplierName',
  'vendorName',
  'description',
  'notes',
  'email',
];

/**
 * A short human name for a record, so the trail reads "Cement — 50 bags"
 * instead of "clx8f2b0a0001".
 */
export function describeRecord(record: unknown): string | null {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const row = record as Record<string, unknown>;

  const first = row.firstName ?? row.first_name;
  const last = row.lastName ?? row.last_name;
  if (typeof first === 'string' && first.trim()) {
    return `${first} ${typeof last === 'string' ? last : ''}`.trim();
  }

  for (const field of LABEL_FIELDS) {
    const value = row[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().length > 80 ? `${value.trim().slice(0, 80)}…` : value.trim();
    }
  }
  return null;
}

/**
 * Entity names arrive in three spellings: the controller class ("FundingSource"),
 * the hand-written calls in ProcurementService ("PURCHASE"), and older rows.
 * One spelling is stored going forward and applied to old rows on read, so the
 * filter dropdown does not list the same thing three times.
 */
export function normalizeEntityType(entityType: string): string {
  if (!entityType) return 'Unknown';
  const collapsed = entityType.replace(/[\s_-]+/g, '').toLowerCase();
  return ENTITY_CANON[collapsed] ?? entityType;
}

const ENTITY_CANON: Record<string, string> = {};
const ENTITY_NAMES = [
  'Project', 'Expense', 'Purchase', 'Payment', 'FundingSource', 'BankLoan',
  'Advance', 'Worker', 'Attendance', 'Material', 'Asset', 'Task', 'DailyReport',
  'Subcontractor', 'Contract', 'User', 'Company', 'Notification', 'Procurement',
  'Report', 'Finance', 'Dashboard', 'Storage', 'Audit',
];
for (const name of ENTITY_NAMES) {
  ENTITY_CANON[name.replace(/[\s_-]+/g, '').toLowerCase()] = name;
}
