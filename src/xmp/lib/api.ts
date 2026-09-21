/**
 * The service seam.
 *
 * Every XMP screen talks to `XmpApi` and nothing else. The mock below stands in until
 * the real Supabase/Postgres layer is available; swapping it is a change to this one
 * module, not a UI rewrite. Each method names the v2 endpoint it must satisfy, so the
 * real implementation has a contract to hit — that is what "data parity, nothing
 * silently dropped" means in practice.
 */

import {
  AccountStatus,
  type Account,
  type AccountsQuery,
  type AccountStatusCode,
  type Country,
  type NewAccountInput,
  type Organization,
  type Paged,
  type UpdateAccountInput,
  type UserSummary,
  type Vertical,
} from './types';

export interface XmpApi {
  /** GET /v2/core/accounts?page&limit&key&my_account&status&org_id&sort_by&order */
  listAccounts(query: AccountsQuery): Promise<Paged<Account>>;
  /** GET /v2/core/accounts/:id */
  getAccount(id: string): Promise<Account>;
  /** POST /v2/core/accounts */
  createAccount(input: NewAccountInput): Promise<Account>;
  /** PUT /v2/core/accounts/:id */
  updateAccount(id: string, input: UpdateAccountInput): Promise<Account>;
  /** PUT /v2/core/accounts/:id/activate */
  activateAccount(id: string): Promise<Account>;
  /** PUT /v2/core/accounts/:id/suspend | /activate_suspended  body {request_reason} */
  setSuspension(id: string, suspend: boolean, reason: string): Promise<Account>;
  /** PUT /v2/core/accounts/:id  body {account:{is_exception}} */
  setException(id: string, isException: boolean): Promise<Account>;
  /** PUT /v2/core/accounts/:id/deactivate?flag=confirm_deactivation|reject_deactivation */
  decideDeactivation(id: string, approve: boolean, comments: string): Promise<Account>;
  /** POST /v2/core/users — assigns a manager to the account */
  assignManager(id: string, userId: string): Promise<Account>;
  /** GET /v2/core/organizations/get_organizations?type=accounts_filter */
  listOrganizations(): Promise<Organization[]>;
  /** GET /v2/core/organizations/:id/users?page&limit&key */
  listOrgUsers(orgId: string | null, search: string): Promise<UserSummary[]>;
  /** GET /v2/core/verticals?key&limit=2000&source=UI */
  listVerticals(): Promise<Vertical[]>;
  /** GET /v2/prl/country */
  listCountries(): Promise<Country[]>;
}

const ORGS: Organization[] = [
  { id: 'org-1', name: 'Meridian Financial' },
  { id: 'org-2', name: 'Coastal Holdings' },
  { id: 'org-3', name: 'Summit Companies' },
  { id: 'org-4', name: 'Harborview Group' },
];

const VERTICALS: Vertical[] = [
  { id: 'v-1', name: 'Financial Services', categories: ['Mortgage Lending', 'Banking', 'Wealth Management'] },
  { id: 'v-2', name: 'Real Estate', categories: ['Residential', 'Commercial', 'Property Management'] },
  { id: 'v-3', name: 'Insurance', categories: ['Personal Lines', 'Commercial Lines'] },
  { id: 'v-4', name: 'Healthcare', categories: ['Dental', 'Primary Care'] },
];

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', timeZones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'], dateFormat: 'MM/DD/YYYY' },
  { code: 'GB', name: 'United Kingdom', timeZones: ['Europe/London'], dateFormat: 'DD/MM/YYYY' },
  { code: 'IN', name: 'India', timeZones: ['Asia/Kolkata'], dateFormat: 'DD/MM/YYYY' },
  { code: 'AU', name: 'Australia', timeZones: ['Australia/Sydney', 'Australia/Perth'], dateFormat: 'DD/MM/YYYY' },
];

const USERS: UserSummary[] = [
  { id: 'u-1', name: 'Dana Whitfield', email: 'dana@meridianfin.test', orgId: 'org-1' },
  { id: 'u-2', name: 'Priya Raman', email: 'priya@meridianfin.test', orgId: 'org-1' },
  { id: 'u-3', name: 'Tom Alvarez', email: 'tom@coastal.test', orgId: 'org-2' },
  { id: 'u-4', name: 'Ines Okafor', email: 'ines@summitco.test', orgId: 'org-3' },
  { id: 'u-5', name: 'Karl Berg', email: 'karl@harborview.test', orgId: 'org-4' },
];

function seed(): Account[] {
  return [
    { id: 'a1', name: 'Meridian Home Loans', organizationId: 'org-1', organizationName: 'Meridian Financial', tiers: 48, users: 1284, activatedOn: '2023-03-12', status: AccountStatus.Active, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Financial Services', category: 'Mortgage Lending', services: ['Reviews', 'Listings', 'Campaigns', 'Insights'], blueprint: 'Standard Enterprise', countryCode: 'US', timeZone: 'America/Chicago', managerId: 'u-1' },
    { id: 'a2', name: 'Harborview Credit Union', organizationId: 'org-4', organizationName: 'Harborview Group', tiers: 31, users: 690, activatedOn: '2023-07-04', status: AccountStatus.Active, isException: true, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Financial Services', category: 'Banking', services: ['Reviews', 'Campaigns'], blueprint: 'Standard Enterprise', countryCode: 'US', timeZone: 'America/New_York', managerId: 'u-5' },
    { id: 'a3', name: 'Brightpath Mortgage', organizationId: 'org-1', organizationName: 'Meridian Financial', tiers: 15, users: 302, activatedOn: '2024-01-22', status: AccountStatus.DeactivationRequested, isException: false, mismatchCount: 0, deactivationRequestedBy: 'u-77', suspensionReason: null, vertical: 'Financial Services', category: 'Mortgage Lending', services: ['Reviews'], blueprint: 'Lite', countryCode: 'US', timeZone: 'America/Denver', managerId: 'u-2' },
    { id: 'a4', name: 'Coastal Realty Group', organizationId: 'org-2', organizationName: 'Coastal Holdings', tiers: 22, users: 410, activatedOn: '2023-09-09', status: AccountStatus.Active, isException: false, mismatchCount: 14, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Real Estate', category: 'Residential', services: ['Reviews', 'Listings'], blueprint: 'Standard Enterprise', countryCode: 'US', timeZone: 'America/Los_Angeles', managerId: 'u-3' },
    { id: 'a5', name: 'Summit Insurance Partners', organizationId: 'org-3', organizationName: 'Summit Companies', tiers: 9, users: 187, activatedOn: '2022-11-18', status: AccountStatus.Suspended, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: 'Billing dispute escalated to finance', vertical: 'Insurance', category: 'Commercial Lines', services: ['Reviews'], blueprint: 'Lite', countryCode: 'US', timeZone: 'America/New_York', managerId: 'u-4' },
    { id: 'a6', name: 'Lakeside Dental Care', organizationId: null, organizationName: 'Unassigned', tiers: 3, users: 24, activatedOn: null, status: AccountStatus.Onboarding, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Healthcare', category: 'Dental', services: ['Reviews'], blueprint: 'Lite', countryCode: 'US', timeZone: 'America/Chicago', managerId: null },
    { id: 'a7', name: 'Redwood Property Mgmt', organizationId: 'org-2', organizationName: 'Coastal Holdings', tiers: 12, users: 233, activatedOn: '2023-02-27', status: AccountStatus.Inactive, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Real Estate', category: 'Property Management', services: ['Listings'], blueprint: 'Lite', countryCode: 'US', timeZone: 'America/Los_Angeles', managerId: 'u-3' },
    { id: 'a8', name: 'Anchor Wealth Advisors', organizationId: 'org-3', organizationName: 'Summit Companies', tiers: 7, users: 96, activatedOn: '2024-05-15', status: AccountStatus.Active, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Financial Services', category: 'Wealth Management', services: ['Reviews', 'Insights'], blueprint: 'Standard Enterprise', countryCode: 'GB', timeZone: 'Europe/London', managerId: 'u-4' },
    { id: 'a9', name: 'Northgate Advisors', organizationId: 'org-3', organizationName: 'Summit Companies', tiers: 5, users: 61, activatedOn: '2024-08-02', status: AccountStatus.Active, isException: false, mismatchCount: 3, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Financial Services', category: 'Wealth Management', services: ['Reviews'], blueprint: 'Lite', countryCode: 'US', timeZone: 'America/New_York', managerId: 'u-4' },
    { id: 'a10', name: 'Bayside Insurance Co', organizationId: 'org-2', organizationName: 'Coastal Holdings', tiers: 18, users: 355, activatedOn: '2023-05-30', status: AccountStatus.Active, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Insurance', category: 'Personal Lines', services: ['Reviews', 'Campaigns'], blueprint: 'Standard Enterprise', countryCode: 'AU', timeZone: 'Australia/Sydney', managerId: 'u-3' },
    { id: 'a11', name: 'Cedar Park Dental', organizationId: null, organizationName: 'Unassigned', tiers: 2, users: 11, activatedOn: null, status: AccountStatus.Onboarding, isException: false, mismatchCount: 0, deactivationRequestedBy: null, suspensionReason: null, vertical: 'Healthcare', category: 'Dental', services: ['Reviews'], blueprint: 'Lite', countryCode: 'US', timeZone: 'America/Chicago', managerId: null },
  ];
}

let ACCOUNTS = seed();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Flip these in the browser console to exercise the states the brief requires. */
export const mockControls = {
  latencyMs: 350,
  forceError: false,
  forceEmpty: false,
};

/** Restores the seed so the demo is repeatable. */
export function resetMockData() {
  ACCOUNTS = seed();
}

function find(id: string): Account {
  const a = ACCOUNTS.find((x) => x.id === id);
  if (!a) throw new Error(`Account ${id} not found`);
  return a;
}

function patch(id: string, changes: Partial<Account>): Account {
  const next = { ...find(id), ...changes };
  ACCOUNTS = ACCOUNTS.map((a) => (a.id === id ? next : a));
  return next;
}

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
    if (query.scope === 'mine') {
      // "My accounts" in v2 means accounts the signed-in user manages.
      rows = rows.filter((a) => a.managerId === (query.managerId ?? 'u-1'));
    }

    if (query.sortBy) {
      const dir = query.sortOrder === 'desc' ? -1 : 1;
      const key = query.sortBy;
      rows.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av === null) return 1;
        if (bv === null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    return { rows: rows.slice(start, start + query.limit), total };
  },

  async getAccount(id) {
    await delay(mockControls.latencyMs / 2);
    return find(id);
  },

  async createAccount(input) {
    await delay(mockControls.latencyMs);
    const org = ORGS.find((o) => o.id === input.organizationId);
    const created: Account = {
      id: `a-${Date.now().toString(36)}`,
      name: input.name,
      organizationId: input.organizationId,
      organizationName: org?.name ?? input.newOrganizationName ?? 'Unassigned',
      tiers: 0,
      users: input.manager ? 1 : 0,
      activatedOn: null,
      status: AccountStatus.Onboarding,
      isException: false,
      mismatchCount: 0,
      deactivationRequestedBy: null,
      suspensionReason: null,
      vertical: input.vertical,
      category: input.category,
      services: input.services,
      blueprint: input.blueprint,
      countryCode: input.countryCode,
      timeZone: input.timeZone,
      managerId: null,
    };
    ACCOUNTS = [created, ...ACCOUNTS];
    return created;
  },

  async updateAccount(id, input) {
    await delay(mockControls.latencyMs);
    return patch(id, input);
  },

  async activateAccount(id) {
    await delay(mockControls.latencyMs);
    return patch(id, {
      status: AccountStatus.Active,
      activatedOn: new Date().toISOString().slice(0, 10),
    });
  },

  async setSuspension(id, suspend, reason) {
    await delay(mockControls.latencyMs);
    return patch(id, {
      status: suspend ? AccountStatus.Suspended : AccountStatus.Active,
      suspensionReason: suspend ? reason : null,
    });
  },

  async setException(id, isException) {
    await delay(mockControls.latencyMs);
    return patch(id, { isException });
  },

  async decideDeactivation(id, approve) {
    await delay(mockControls.latencyMs);
    return patch(id, {
      status: approve ? AccountStatus.Inactive : AccountStatus.Active,
      deactivationRequestedBy: null,
    });
  },

  async assignManager(id, userId) {
    await delay(mockControls.latencyMs);
    return patch(id, { managerId: userId });
  },

  async listOrganizations() {
    await delay(mockControls.latencyMs / 2);
    return ORGS;
  },

  async listOrgUsers(orgId, search) {
    await delay(mockControls.latencyMs / 2);
    const q = search.trim().toLowerCase();
    return USERS.filter(
      (u) =>
        (!orgId || u.orgId === orgId) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  },

  async listVerticals() {
    await delay(mockControls.latencyMs / 2);
    return VERTICALS;
  },

  async listCountries() {
    await delay(mockControls.latencyMs / 2);
    return COUNTRIES;
  },
};

export const STATUS_OPTIONS: { value: AccountStatusCode; label: string }[] = [
  { value: AccountStatus.Active, label: 'Active' },
  { value: AccountStatus.Inactive, label: 'Inactive' },
  { value: AccountStatus.DeactivationRequested, label: 'Deactivation requested' },
  { value: AccountStatus.Onboarding, label: 'Onboarding' },
  { value: AccountStatus.Suspended, label: 'Suspended' },
];

export const SERVICE_OPTIONS = ['Reviews', 'Listings', 'Campaigns', 'Insights', 'Web Analytics'];
export const BLUEPRINTS = ['Standard Enterprise', 'Lite', 'Franchise'];
