import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState, ErrorState, LoadingRows } from '../../components/States';
import { StatusPill } from '../../components/StatusPill';
import { mockApi, STATUS_OPTIONS } from '../../lib/api';
import { can } from '../../lib/permissions';
import {
  AccountStatus,
  type Account,
  type AccountSortKey,
  type Organization,
} from '../../lib/types';
import { cn } from '../../lib/utils';
import { useXmpSession } from '../../session';
import { AccountFormDrawer } from './AccountFormDrawer';
import { AssignManagerModal } from './AssignManagerModal';
import {
  ActivateDrawer,
  DeactivationDecisionDrawer,
  ExceptionDrawer,
  SuspensionDrawer,
} from './ConfirmDrawers';
import { EditAccountDrawer } from './EditAccountDrawer';
import { EMPTY_FILTERS, FilterPanel, type Filters } from './FilterPanel';
import { RowActions, type RowAction } from './RowActions';

type Scope = 'all' | 'mine' | 'new';

const TABS: { id: Scope; label: string }[] = [
  { id: 'all', label: 'All accounts' },
  { id: 'mine', label: 'My accounts' },
  { id: 'new', label: 'Onboarding' },
];

const COLUMNS: { key: AccountSortKey | null; label: string; className: string }[] = [
  { key: 'name', label: 'Account', className: 'flex-1' },
  { key: 'tiers', label: 'Tiers', className: 'w-20 justify-end' },
  { key: 'users', label: 'Users', className: 'w-24 justify-end' },
  { key: 'activatedOn', label: 'Activated', className: 'w-32 pl-6' },
  { key: 'status', label: 'Status', className: 'w-52' },
  { key: null, label: 'Actions', className: 'w-64 justify-end' },
];

type DrawerKind =
  | 'create'
  | 'duplicate'
  | 'edit'
  | 'activate'
  | 'exception'
  | 'suspension'
  | 'deactivation'
  | 'assignManager';

export function AccountsPage() {
  const { session } = useXmpSession();

  const [scope, setScope] = useState<Scope>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<AccountSortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  const [rows, setRows] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [drawer, setDrawer] = useState<DrawerKind | null>(null);
  const [target, setTarget] = useState<Account | null>(null);

  useEffect(() => {
    void mockApi.listOrganizations().then(setOrgs);
  }, []);

  // v2 debounces the account search by 800ms.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    mockApi
      .listAccounts({
        page,
        limit,
        search: debounced,
        scope,
        sortBy,
        sortOrder,
        status: filters.status.length ? filters.status : undefined,
        organizationId: filters.organizationId || undefined,
      })
      .then((res) => {
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Unknown error')
      )
      .finally(() => setLoading(false));
  }, [page, limit, debounced, scope, sortBy, sortOrder, filters]);

  useEffect(load, [load]);

  // The deactivation-request banner needs a count independent of the current filters.
  const refreshPending = useCallback(() => {
    void mockApi
      .listAccounts({
        page: 1,
        limit: 500,
        status: [AccountStatus.DeactivationRequested],
      })
      .then((r) => setPendingCount(r.total))
      .catch(() => setPendingCount(0));
  }, []);
  useEffect(refreshPending, [refreshPending]);

  // Any filter change resets to page 1 — v2 forgets to do this in places.
  useEffect(() => setPage(1), [debounced, scope, filters, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const chips = useMemo(() => {
    const out: { id: string; label: string; clear: () => void }[] = [];
    for (const s of filters.status) {
      const label = STATUS_OPTIONS.find((o) => o.value === s)?.label ?? String(s);
      out.push({
        id: `status-${s}`,
        label: `Status: ${label}`,
        clear: () =>
          setFilters((f) => ({ ...f, status: f.status.filter((x) => x !== s) })),
      });
    }
    if (filters.organizationId) {
      const org = orgs.find((o) => o.id === filters.organizationId);
      out.push({
        id: 'org',
        label: `Organization: ${org?.name ?? filters.organizationId}`,
        clear: () => setFilters((f) => ({ ...f, organizationId: '' })),
      });
    }
    return out;
  }, [filters, orgs]);

  const openFor = (kind: DrawerKind, account: Account | null) => {
    setTarget(account);
    setDrawer(kind);
  };

  const onRowAction = (action: RowAction, account: Account) => {
    const map: Partial<Record<RowAction, DrawerKind>> = {
      duplicate: 'duplicate',
      edit: 'edit',
      activate: 'activate',
      exception: 'exception',
      suspension: 'suspension',
      assignManager: 'assignManager',
    };
    const kind = map[action];
    if (kind) openFor(kind, account);
  };

  const afterChange = () => {
    load();
    refreshPending();
  };

  const toggleSort = (key: AccountSortKey) => {
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* ACC-02 — header band */}
      <header className="border-b border-border px-10 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {total} account{total === 1 ? '' : 's'} matching your filters
            </p>
          </div>
          <Button variant="outline" size="md">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Button>
          {can(session, 'account', 'create') ? (
            <Button variant="primary" size="md" onClick={() => openFor('create', null)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New account
            </Button>
          ) : null}
        </div>

        {session.isSuperAdmin && pendingCount > 0 ? (
          <button
            type="button"
            onClick={() => setFilters({ ...filters, status: [AccountStatus.DeactivationRequested] })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-3.5 py-2 text-left"
          >
            <TriangleAlert className="h-4 w-4 shrink-0 text-[#b54708]" aria-hidden="true" />
            <span className="text-[12.5px] font-medium text-[#93370d]">
              {pendingCount} account{pendingCount === 1 ? '' : 's'} requested deactivation
            </span>
            <span className="ml-auto text-[12px] font-semibold text-[#b54708]">
              Review
            </span>
          </button>
        ) : null}
      </header>

      <div className="flex gap-6 border-b border-border px-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setScope(t.id)}
            className={cn(
              'border-b-2 py-3 text-sm transition-colors',
              scope === t.id
                ? 'border-foreground font-semibold text-foreground'
                : 'border-transparent font-medium text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-10 py-3.5">
        <label htmlFor="acct-search" className="sr-only">
          Search accounts
        </label>
        <div className="flex w-72 items-center gap-2 rounded-md border border-input bg-card px-2.5 py-1.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id="acct-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts or organizations"
            className="w-full bg-transparent text-[13px] outline-none"
          />
        </div>

        {chips.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-full border border-accent-border bg-accent-soft py-1 pr-1 pl-3 text-xs font-medium text-accent"
          >
            {c.label}
            <button
              type="button"
              aria-label={`Remove filter ${c.label}`}
              onClick={c.clear}
              className="rounded-full p-0.5 hover:bg-card"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}

        <FilterPanel filters={filters} onChange={setFilters} />

        <div className="flex-1" />
        <label htmlFor="page-size" className="text-[12.5px] text-muted-foreground">
          Rows
        </label>
        <select
          id="page-size"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="h-8 rounded-md border border-input bg-card px-2 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {[8, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {selected.length > 0 ? (
        <div className="mx-10 mb-3 flex items-center gap-3 rounded-lg border border-accent-border bg-accent-soft px-3.5 py-2">
          <span className="text-[13px] font-semibold text-accent">
            {selected.length} selected
          </span>
          <span className="h-4 w-px bg-accent-border" />
          <Button variant="soft">Assign manager</Button>
          <Button variant="soft">Configure products</Button>
          <Button variant="soft">Export selection</Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-10 pb-6">
        {/* ACC-04 — table */}
        <div className="flex h-10 items-center border-y border-border bg-muted text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <div className="w-10 pl-1">
            <input
              type="checkbox"
              checked={allOnPage}
              onChange={() => setSelected(allOnPage ? [] : rows.map((r) => r.id))}
              aria-label="Select all accounts on this page"
              className="h-4 w-4 accent-[#1b4db1]"
            />
          </div>
          {COLUMNS.map((c) =>
            c.key ? (
              <button
                key={c.label}
                type="button"
                onClick={() => toggleSort(c.key!)}
                aria-sort={
                  sortBy === c.key
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className={cn(
                  'flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase hover:text-foreground',
                  c.className
                )}
              >
                {c.label}
                {sortBy === c.key ? (
                  sortOrder === 'asc' ? (
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  )
                ) : null}
              </button>
            ) : (
              <div key={c.label} className={cn('flex', c.className)}>
                {c.label}
              </div>
            )
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? <LoadingRows rows={Math.min(limit, 8)} /> : null}

          {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}

          {!loading && !error && rows.length === 0 ? (
            <EmptyState
              title="No accounts match these filters"
              hint="Try clearing a filter or searching for a different organization."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS);
                    setSearch('');
                  }}
                >
                  Clear all filters
                </Button>
              }
            />
          ) : null}

          {!loading && !error
            ? rows.map((a) => {
                const isSelected = selected.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'flex h-[62px] items-center border-b border-border',
                      isSelected && 'bg-accent-soft'
                    )}
                  >
                    <div className="w-10 pl-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]
                          )
                        }
                        aria-label={`Select ${a.name}`}
                        className="h-4 w-4 accent-[#1b4db1]"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <a
                          href="#account"
                          className="truncate text-sm font-semibold text-accent hover:underline"
                        >
                          {a.name}
                        </a>
                        {a.isException ? (
                          <span className="rounded border border-[#e4e1fb] bg-[#f4f3ff] px-1.5 text-[10px] font-semibold tracking-wide text-[#6941c6]">
                            EXCEPTION
                          </span>
                        ) : null}
                        {a.mismatchCount > 0 ? (
                          <a
                            href="#mismatches"
                            className="rounded border border-[#fedf89] bg-[#fffaeb] px-1.5 text-[11px] font-semibold text-[#b54708]"
                          >
                            {a.mismatchCount} mismatches
                          </a>
                        ) : null}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {a.organizationName}
                      </span>
                    </div>
                    <div className="w-20 text-right font-mono text-[13px]">{a.tiers}</div>
                    <div className="w-24 text-right font-mono text-[13px]">
                      {a.users.toLocaleString()}
                    </div>
                    <div className="w-32 pl-6 text-[12.5px] text-muted-foreground">
                      {a.activatedOn
                        ? new Date(a.activatedOn).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Not yet'}
                    </div>
                    <div className="w-52">
                      <StatusPill
                        status={a.status}
                        title={a.suspensionReason ?? undefined}
                      />
                    </div>
                    <div className="flex w-64 items-center justify-end gap-1.5">
                      {a.status === AccountStatus.DeactivationRequested ? (
                        <Button
                          variant="danger"
                          onClick={() => openFor('deactivation', a)}
                        >
                          Review request
                        </Button>
                      ) : (
                        <Button variant="outline">Open</Button>
                      )}
                      {can(session, 'account', 'setting') ? (
                        <Button variant="outline" disabled title="AccountSettings module — not ported yet">
                          Settings
                        </Button>
                      ) : null}
                      <RowActions account={a} onAction={onRowAction} />
                    </div>
                  </div>
                );
              })
            : null}
        </div>

        {!loading && !error && total > 0 ? (
          <div className="flex items-center border-t border-border pt-3">
            <span className="text-[12.5px] text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="px-2 text-[12.5px] text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ACC-06 / ACC-07 / ACC-08 / ACC-09 */}
      <AccountFormDrawer
        open={drawer === 'create' || drawer === 'duplicate'}
        mode={drawer === 'duplicate' ? 'duplicate' : 'create'}
        source={target}
        onOpenChange={(o) => !o && setDrawer(null)}
        onSaved={afterChange}
      />
      {/* ACC-10 */}
      <EditAccountDrawer
        account={drawer === 'edit' ? target : null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onSaved={afterChange}
      />
      {/* ACC-11 + ACC-12 merged */}
      <ActivateDrawer
        account={drawer === 'activate' ? target : null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onDone={afterChange}
      />
      {/* ACC-13 */}
      <DeactivationDecisionDrawer
        account={drawer === 'deactivation' ? target : null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onDone={afterChange}
      />
      {/* ACC-14 */}
      <ExceptionDrawer
        account={drawer === 'exception' ? target : null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onDone={afterChange}
      />
      {/* ACC-15 */}
      <SuspensionDrawer
        account={drawer === 'suspension' ? target : null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onDone={afterChange}
      />
      {/* ACC-16 */}
      <AssignManagerModal
        account={drawer === 'assignManager' ? target : null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onDone={afterChange}
      />
    </div>
  );
}
