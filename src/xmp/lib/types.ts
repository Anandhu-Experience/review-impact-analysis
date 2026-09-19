/**
 * Domain types for the XMP port.
 *
 * Data parity rule: nothing silently dropped. Where v2 carries a raw numeric code we
 * keep the code (so the API contract still matches) but never show it to a user —
 * today a row in XMP can literally render "3" as a status.
 */

/** v2 account status codes, from AccountsSearchFilter/DropdownOptions.js */
export const AccountStatus = {
  Onboarding: 0,
  Active: 1,
  Inactive: -1,
  DeactivationRequested: 3,
  Suspended: -3,
} as const;

export type AccountStatusCode = (typeof AccountStatus)[keyof typeof AccountStatus];

export const ACCOUNT_STATUS_LABEL: Record<AccountStatusCode, string> = {
  [AccountStatus.Onboarding]: 'Onboarding',
  [AccountStatus.Active]: 'Active',
  [AccountStatus.Inactive]: 'Inactive',
  [AccountStatus.DeactivationRequested]: 'Deactivation requested',
  [AccountStatus.Suspended]: 'Suspended',
};

export type StatusTone = 'active' | 'onboarding' | 'inactive' | 'suspended' | 'pending';

export const ACCOUNT_STATUS_TONE: Record<AccountStatusCode, StatusTone> = {
  [AccountStatus.Onboarding]: 'onboarding',
  [AccountStatus.Active]: 'active',
  [AccountStatus.Inactive]: 'inactive',
  [AccountStatus.DeactivationRequested]: 'pending',
  [AccountStatus.Suspended]: 'suspended',
};

export interface Account {
  id: string;
  name: string;
  organizationId: string | null;
  organizationName: string;
  tiers: number;
  users: number;
  /** ISO date, or null when never activated */
  activatedOn: string | null;
  status: AccountStatusCode;
  isException: boolean;
  mismatchCount: number;
  /** v2: the account cannot be actioned by whoever raised the request */
  deactivationRequestedBy: string | null;
  suspensionReason: string | null;
}

export interface AccountsQuery {
  page: number;
  limit: number;
  search?: string;
  /** empty means all */
  status?: AccountStatusCode[];
  organizationId?: string;
  scope?: 'all' | 'mine' | 'new';
}

export interface Paged<T> {
  rows: T[];
  total: number;
}

export interface Organization {
  id: string;
  name: string;
}
