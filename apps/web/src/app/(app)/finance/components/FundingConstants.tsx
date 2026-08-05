
type TabId = 'overview' | 'wallets' | 'allocations' | 'purchases' | 'expenses' | 'assets' | 'loans' | 'forecast' | 'audit';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'overview',    label: 'Overview',      icon: BarChart2,         description: 'Cash flow and burn rates' },
  { id: 'wallets',     label: 'Funding Wallets', icon: Coins,            description: 'Capital source pools' },
  { id: 'allocations', label: 'Allocations Matrix', icon: FileSpreadsheet, description: 'Cross-project split matrices' },
  { id: 'purchases',   label: 'Purchases',     icon: TrendingDown,      description: 'Material purchases' },
  { id: 'expenses',    label: 'Expenses',      icon: CircleDollarSign,  description: 'Field operation expenses' },
  { id: 'assets',      label: 'Assets',        icon: Building2,         description: 'Company asset registry' },
  { id: 'loans',       label: 'Bank Loans',    icon: Landmark,          description: 'Loan repayment schedules' },
  { id: 'forecast',    label: 'Forecast',      icon: Zap,               description: 'Capital burn forecast' },
  { id: 'audit',       label: 'Audit Trail',   icon: FileText,          description: 'Journal ledger' },
];

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Landmark, CircleDollarSign, RefreshCw, BarChart2, Coins, FileSpreadsheet, TrendingDown, Zap, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;

// ── Enterprise Source Type Config (mirrors backend) ────────────
export const SOURCE_CATEGORIES: Record<string, { label: string; icon: React.ElementType; types: { type: string; label: string; icon: string; description: string; redirect?: string; fields?: string[] }[] }> = {
  capital: {
    label: 'Capital & Equity',
    icon: Building2,
    types: [
      { type: 'COMPANY_CASH', label: 'Company Capital', icon: 'building', description: 'Operating cash from company reserves', fields: ['amount', 'department', 'date', 'reference', 'approvedBy', 'notes'] },
      { type: 'OWNER_CAPITAL', label: 'Owner Investment', icon: 'user', description: 'Personal capital injected by owner', fields: ['ownerName', 'investmentType', 'amount', 'paymentMethod', 'reference', 'date', 'notes'] },
      { type: 'DIRECTOR_INVESTMENT', label: 'Director Investment', icon: 'briefcase', description: 'Capital from company directors', fields: ['directorName', 'investmentType', 'amount', 'paymentMethod', 'reference', 'date', 'notes'] },
      { type: 'SHAREHOLDER_CONTRIBUTION', label: 'Shareholder Contribution', icon: 'users', description: 'Equity injections from shareholders', fields: ['shareholderName', 'sharePercentage', 'amount', 'paymentMethod', 'reference', 'date', 'notes'] },
      { type: 'INVESTOR_FUNDING', label: 'Investor Funding', icon: 'trending-up', description: 'External investor capital', fields: ['investorName', 'fundingRound', 'amount', 'terms', 'reference', 'date', 'notes'] },
    ],
  },
  loans: {
    label: 'Loans & Credit',
    icon: Landmark,
    types: [
      { type: 'BANK_LOAN', label: 'Bank Loan', icon: 'landmark', description: 'Standard bank loan facility', redirect: 'loans' },
      { type: 'EMERGENCY_LOAN', label: 'Emergency Loan', icon: 'alert-triangle', description: 'Short-term emergency financing', fields: ['lenderName', 'amount', 'interestRate', 'duration', 'reference', 'date', 'notes'] },
      { type: 'EQUIPMENT_LOAN', label: 'Equipment Loan', icon: 'wrench', description: 'Equipment financing facility', fields: ['lenderName', 'equipmentDescription', 'amount', 'interestRate', 'reference', 'date', 'notes'] },
      { type: 'VEHICLE_LOAN', label: 'Vehicle Loan', icon: 'truck', description: 'Vehicle financing', fields: ['lenderName', 'vehicleDescription', 'amount', 'interestRate', 'reference', 'date', 'notes'] },
      { type: 'SUPPLIER_CREDIT', label: 'Supplier Credit', icon: 'package', description: 'Credit line from material suppliers', fields: ['supplierName', 'creditLimit', 'amount', 'terms', 'reference', 'date', 'notes'] },
    ],
  },
  client: {
    label: 'Client Payments',
    icon: CircleDollarSign,
    types: [
      { type: 'PROJECT_ADVANCE', label: 'Customer Advance', icon: 'dollar-sign', description: 'Mobilization advance from client', redirect: 'advances' },
      { type: 'CLIENT_PROGRESS_PAYMENT', label: 'Client Progress Payment', icon: 'check-circle', description: 'Milestone-based progress payment', fields: ['projectId', 'milestone', 'invoiceNumber', 'certificateNo', 'retentionPercent', 'amount', 'date', 'notes'] },
    ],
  },
  internal: {
    label: 'Internal & Other',
    icon: RefreshCw,
    types: [
      { type: 'INTERNAL_TRANSFER', label: 'Internal Transfer', icon: 'repeat', description: 'Transfer between accounts', fields: ['fromAccount', 'toAccount', 'reason', 'amount', 'reference', 'date', 'notes'] },
      { type: 'FIXED_DEPOSIT_WITHDRAWAL', label: 'Fixed Deposit Withdrawal', icon: 'lock', description: 'FD withdrawal', fields: ['bankName', 'fdNumber', 'amount', 'interestEarned', 'reference', 'date', 'notes'] },
      { type: 'TREASURY_RESERVE', label: 'Treasury Reserve', icon: 'shield', description: 'Reserved funds', fields: ['reservePurpose', 'amount', 'reference', 'date', 'notes'] },
      { type: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: 'life-buoy', description: 'Emergency reserve', fields: ['reason', 'amount', 'approvalLevel', 'reference', 'date', 'notes'] },
      { type: 'EQUIPMENT_SALE', label: 'Equipment Sale', icon: 'tag', description: 'Sold equipment revenue', fields: ['equipmentName', 'buyerName', 'amount', 'originalPrice', 'reference', 'date', 'notes'] },
      { type: 'ASSET_SALE', label: 'Asset Sale', icon: 'home', description: 'Sold asset revenue', fields: ['assetName', 'buyerName', 'amount', 'originalPrice', 'reference', 'date', 'notes'] },
      { type: 'REFUND', label: 'Refund', icon: 'rotate-ccw', description: 'Refund received', fields: ['refundFrom', 'reason', 'amount', 'reference', 'date', 'notes'] },
      { type: 'GOVERNMENT_GRANT', label: 'Government Grant', icon: 'award', description: 'Grant funding', fields: ['grantingBody', 'grantName', 'amount', 'conditions', 'reference', 'date', 'notes'] },
      { type: 'INSURANCE_CLAIM', label: 'Insurance Claim', icon: 'file-text', description: 'Insurance settlement', fields: ['insuranceCompany', 'claimNumber', 'amount', 'reference', 'date', 'notes'] },
      { type: 'OTHER_INCOME', label: 'Other Income', icon: 'plus-circle', description: 'Miscellaneous income', fields: ['incomeDescription', 'category', 'amount', 'reference', 'date', 'notes'] },
    ],
  },
};

export const FIELD_LABELS: Record<string, string> = {
  amount: 'Amount (LKR)', department: 'Department', date: 'Date', reference: 'Reference No', approvedBy: 'Approved By',
  notes: 'Notes', ownerName: 'Owner Name', investmentType: 'Investment Type', paymentMethod: 'Payment Method',
  directorName: 'Director Name', shareholderName: 'Shareholder Name', sharePercentage: 'Share %',
  investorName: 'Investor Name', fundingRound: 'Funding Round', terms: 'Terms & Conditions',
  lenderName: 'Lender Name', interestRate: 'Interest Rate (%)', duration: 'Duration (months)',
  repaymentDate: 'Repayment Date', equipmentDescription: 'Equipment Description',
  vehicleDescription: 'Vehicle Description', supplierName: 'Supplier Name', creditLimit: 'Credit Limit',
  projectId: 'Project', milestone: 'Milestone', invoiceNumber: 'Invoice No', certificateNo: 'Certificate No',
  retentionPercent: 'Retention %', fromAccount: 'From Account', toAccount: 'To Account', reason: 'Reason',
  bankName: 'Bank Name', fdNumber: 'FD Number', interestEarned: 'Interest Earned',
  reservePurpose: 'Reserve Purpose', approvalLevel: 'Approval Level',
  equipmentName: 'Equipment Name', buyerName: 'Buyer Name', originalPrice: 'Original Price (LKR)',
  assetName: 'Asset Name', refundFrom: 'Refund From', grantingBody: 'Granting Body',
  grantName: 'Grant Name', conditions: 'Conditions', insuranceCompany: 'Insurance Company',
  claimNumber: 'Claim Number', incomeDescription: 'Description', category: 'Category',
};

export const NUMERIC_FIELDS = ['amount', 'interestRate', 'sharePercentage', 'creditLimit', 'retentionPercent', 'interestEarned', 'originalPrice'];
export const DATE_FIELDS = ['date', 'repaymentDate'];

export const inputCls = 'flex h-9 w-full rounded-xl border border-border/40 bg-accent/20 px-3 py-1.5 text-[13px] outline-none focus:border-foreground/30 focus:ring-2 focus:ring-ring/20 font-medium transition-all';

// ── Upcoming Repayments Mini-Card ──────────────────────────────
export function UpcomingRepaymentsCard() {
  const { data: loans } = useQuery<any[]>({
    queryKey: ['bank-loans'],
    queryFn: async () => (await apiClient.get('/bank-loans')).data,
    retry: 1,
  });

  const activeLoans = (loans || []).filter((l: any) => l.status === 'ACTIVE');
  if (activeLoans.length === 0) return null;

  return (
    <Card className="glass-panel border-border/25 shadow-surface text-left">
      <CardContent className="p-4 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Active Loan Obligations</h4>
        <div className="space-y-2.5">
          {activeLoans.slice(0, 4).map((loan: any) => (
            <div key={loan.id} className="flex items-center justify-between text-[11px]">
              <div>
                <p className="font-bold text-foreground/85 text-[11px]">{loan.bankName}</p>
                <p className="text-[9px] font-mono text-muted-foreground/50">
                  Outstanding: {fmt(loan.outstandingDebt || 0)}
                </p>
              </div>
              <span className={cn(
                'chip font-mono text-[9px]',
                (loan.outstandingDebt || 0) > 0 ? 'bg-warning-subtle border-warning/25 text-warning' : 'bg-success-subtle border-success/25 text-success'
              )}>
                {(loan.outstandingDebt || 0) > 0 ? 'Active' : 'Settled'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Funding Wallets Tab (Enterprise Redesign) ─────────────────

