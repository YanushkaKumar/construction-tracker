import type { QueryClient } from '@tanstack/react-query';

/**
 * Query keys that reflect money moving through the company.
 *
 * Anything that spends, allocates or receives funds changes more than the
 * list it was entered on: the dashboard totals, the finance overview, the
 * funding pool balances and the owning project's figures all shift too.
 * Invalidating only the current page left every other screen showing stale
 * numbers until it was reloaded by hand.
 */
const FINANCIAL_KEYS = [
  'dashboard',
  'finance-overview',
  'finance-bills',
  'funding-dashboard',
  'funding-sources',
  'projects',
  'project',
  'project-expenses',
  'expenses',
  'pending-expenses',
  'purchases',
  'advances',
  'bank-loans',
  'assets',
  'subcontractor-contracts',
] as const;

/** Refresh every view whose numbers depend on company funds. */
export function invalidateFinancials(queryClient: QueryClient) {
  for (const key of FINANCIAL_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

/** Refresh views that depend on the workforce and its costs. */
export function invalidateWorkforce(queryClient: QueryClient) {
  for (const key of ['workers', 'payroll', 'attendance', 'dashboard']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
