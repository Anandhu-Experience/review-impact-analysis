import { Download, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, LoadingRows } from '../components/States';
import { StatusPill } from '../components/StatusPill';
import { mockApi } from '../lib/api';
import { can } from '../lib/permissions';
import { AccountStatus, type Account, type AccountsQuery } from '../lib/types';
import { cn } from '../lib/utils';
import { useXmpSession } from '../session';

const PAGE_SIZE = 8;

type Scope = NonNullable<AccountsQuery['scope']>;

const TABS: { id: Scope; label: string }[] = [
  { id: 'all', label: 'All accounts' },
  { id: 'mine', label: 'My accounts' },
  { id: 'new', label: 'Onboarding' },
];

interface Chip {
  id: string;
  label: string;
}

export function AccountsPage() {
  const { session } = useXmpSession();
  const [scope, setScope] = useState<Scope>('all');
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Chip[]>([
    { id: 'status', label: 'Status: Active, Onboarding' },
  ]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    mockApi
      .listAccounts({ page: 1, limit: PAGE_SIZE, search, scope })
      .then((res) => {
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Unknown error')
      )
      .finally(() => setLoading(false));
  }, [search, scope]);

  useEffect(load, [load]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allOnPage ? [] : rows.map((r) => r.id));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start gap-4 border-b border-border px-10 pt-6 pb-4">
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
        {/* v2 gates this on userPermission.account.includes('create') */}
        {can(session, 'account', 'create') ? (
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New account
          </Button>
        ) : null}
      </header>

      {/* v2 uses a Button.Group here — no counts, no URL state. */}
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
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="acct-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts or organizations"
            className="w-full bg-transparent text-[13px] outline-none"
          />
        </div>

        {/* v2 hides every filter behind a toggle and offers only a global Clear. */}
        {chips.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-full border border-accent-border bg-accent-soft py-1 pr-1 pl-3 text-xs font-medium text-accent"
          >
            {c.label}
            <button
              type="button"
              aria-label={`Remove filter ${c.label}`}
              onClick={() => setChips((x) => x.filter((y) => y.id !== c.id))}
              className="rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-input px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add filter
        </button>
      </div>

      {/* v2 has no row selection and no bulk actions anywhere in this module. */}
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

      <div className="flex-1 px-10 pb-8">
        <div className="flex h-10 items-center border-y border-border bg-muted text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <div className="w-10 pl-1">
            <input
              type="checkbox"
              checked={allOnPage}
              onChange={toggleAll}
              aria-label="Select all accounts on this page"
              className="h-4 w-4 accent-[#1b4db1]"
            />
          </div>
          <div className="flex-1">Account</div>
          <div className="w-20 text-right">Tiers</div>
          <div className="w-24 text-right">Users</div>
          <div className="w-32 pl-6">Activated</div>
          <div className="w-52">Status</div>
          <div className="w-56 text-right">Actions</div>
        </div>

        {loading ? <LoadingRows /> : null}

        {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error && rows.length === 0 ? (
          <EmptyState
            title="No accounts match these filters"
            hint="Try clearing a filter or searching for a different organization."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setChips([]);
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
                      onChange={() => toggle(a.id)}
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
                  {/* v2 buries all 11 actions in one dropdown with no primary action. */}
                  <div className="flex w-56 items-center justify-end gap-1.5">
                    {a.status === AccountStatus.DeactivationRequested ? (
                      <Button variant="danger">Review request</Button>
                    ) : (
                      <Button variant="outline">Open</Button>
                    )}
                    {can(session, 'account', 'setting') ? (
                      <Button variant="outline">Settings</Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`More actions for ${a.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}
