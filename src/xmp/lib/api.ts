/**
 * The service seam.
 *
 * Every XMP screen talks to `XmpApi` and nothing else. The mock below stands in until
 * the real shell's Supabase/Postgres layer is available; swapping it is a change to
 * this one module, not a UI rewrite. Keep the interface shaped like the real endpoints:
 *   GET /v2/core/accounts?page&limit&key&my_account&status&org_id
 *   GET /v2/core/organizations/get_organizations
 */

import {
  AccountStatus,
  type Account,
  type AccountsQuery,
  type Organization,
  type Paged,
} from './types';

export interface XmpApi {
  listAccounts(query: AccountsQuery): Promise<Paged<Account>>;
  listOrganizations(): Promise<Organization[]>;
}

const ORGS: Organization[] = [
  { id: 'org-1', name: 'Meridian Financial' },
  { id: 'org-2', name: 'Coastal Holdings' },
  { id: 'org-3', name: 'Summit Companies' },
  { id: 'org-4', name: 'Harborview Group' },
];

const ACCOUNTS: Account[] = [
  {
    id: 'a1', name: 'Meridian Home Loans', organizationId: 'org-1',
    organizationName: 'Meridian Financial', tiers: 48, users: 1284,
    activatedOn: '2023-03-12', status: AccountStatus.Active, isException: false,
    mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null,
  },
  {
    id: 'a2', name: 'Harborview Credit Union', organizationId: 'org-4',
    organizationName: 'Harborview Group', tiers: 31, users: 690,
    activatedOn: '2023-07-04', status: AccountStatus.Active, isException: true,
    mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null,
  },
  {
    id: 'a3', name: 'Brightpath Mortgage', organizationId: 'org-1',
    organizationName: 'Meridian Financial', tiers: 15, users: 302,
    activatedOn: '2024-01-22', status: AccountStatus.DeactivationRequested,
    isException: false, mismatchCount: 0, deactivationRequestedBy: 'u-77',
    suspensionReason: null,
  },
  {
    id: 'a4', name: 'Coastal Realty Group', organizationId: 'org-2',
    organizationName: 'Coastal Holdings', tiers: 22, users: 410,
    activatedOn: '2023-09-09', status: AccountStatus.Active, isException: false,
    mismatchCount: 14, deactivationRequestedBy: null, suspensionReason: null,
  },
  {
    id: 'a5', name: 'Summit Insurance Partners', organizationId: 'org-3',
    organizationName: 'Summit Companies', tiers: 9, users: 187,
    activatedOn: '2022-11-18', status: AccountStatus.Suspended, isException: false,
    mismatchCount: 0, deactivationRequestedBy: null,
    suspensionReason: 'Billing dispute escalated to finance',
  },
  {
    id: 'a6', name: 'Lakeside Dental Care', organizationId: null,
    organizationName: 'Unassigned', tiers: 3, users: 24,
    activatedOn: null, status: AccountStatus.Onboarding, isException: false,
    mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null,
  },
  {
    id: 'a7', name: 'Redwood Property Mgmt', organizationId: 'org-2',
    organizationName: 'Coastal Holdings', tiers: 12, users: 233,
    activatedOn: '2023-02-27', status: AccountStatus.Inactive, isException: false,
    mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null,
  },
  {
    id: 'a8', name: 'Anchor Wealth Advisors', organizationId: 'org-3',
    organizationName: 'Summit Companies', tiers: 7, users: 96,
    activatedOn: '2024-05-15', status: AccountStatus.Active, isException: false,
    mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null,
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Flip these in the browser console to exercise the states the brief requires. */
export const mockControls = {
  latencyMs: 450,
  forceError: false,
  forceEmpty: false,
};

export const mockApi: XmpApi = {
  async listAccounts(query) {
    await delay(mockControls.latencyMs);
    if (mockControls.forceError) throw new Error('Unable to load accounts');
    if (mockControls.forceEmpty) return { rows: [], total: 0 };

    let rows = ACCOUNTS.slice();

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      rows = rows.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.organizationName.toLowerCase().includes(q)
      );
    }
    if (query.status?.length) {
      rows = rows.filter((a) => query.status!.includes(a.status));
    }
    if (query.organizationId) {
      rows = rows.filter((a) => a.organizationId === query.organizationId);
    }
    if (query.scope === 'new') {
      rows = rows.filter((a) => a.status === AccountStatus.Onboarding);
    }

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    return { rows: rows.slice(start, start + query.limit), total };
  },

  async listOrganizations() {
    await delay(mockControls.latencyMs / 2);
    return ORGS;
  },
};
