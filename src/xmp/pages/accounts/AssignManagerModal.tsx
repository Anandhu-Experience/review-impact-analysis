import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Drawer';
import { EmptyState } from '../../components/States';
import { mockApi } from '../../lib/api';
import type { Account, UserSummary } from '../../lib/types';
import { cn } from '../../lib/utils';

/** ACC-16 — Assign Account Manager. Search is scoped to the account's organization. */
export function AssignManagerModal({
  account,
  onOpenChange,
  onDone,
}: {
  account: Account | null;
  onOpenChange: (o: boolean) => void;
  onDone: (a: Account) => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!account) return;
    setPicked(account.managerId);
    setSearch('');
  }, [account]);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    const t = setTimeout(() => {
      void mockApi
        .listOrgUsers(account.organizationId, search)
        .then(setUsers)
        .finally(() => setLoading(false));
    }, 250); // v2 debounces this search
    return () => clearTimeout(t);
  }, [account, search]);

  if (!account) return null;

  const submit = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      onDone(await mockApi.assignManager(account.id, picked));
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Assign manager"
      description={`${account.name} · ${account.organizationName}`}
      footer={
        <>
          <div className="flex-1" />
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="md" disabled={!picked || busy} onClick={submit}>
            {busy ? 'Assigning…' : 'Assign manager'}
          </Button>
        </>
      }
    >
      <label htmlFor="mgr-search" className="sr-only">
        Search people in this organization
      </label>
      <div className="mb-3 flex items-center gap-2 rounded-md border border-input px-2.5 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          id="mgr-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-transparent text-[13px] outline-none"
        />
      </div>

      {loading ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">Searching…</p>
      ) : users.length === 0 ? (
        <EmptyState
          title="Nobody found"
          hint={
            account.organizationId
              ? 'No one in this organization matches that search.'
              : 'This account has no organization, so there is nobody to assign.'
          }
        />
      ) : (
        <div className="max-h-72 space-y-1 overflow-auto">
          {users.map((u) => (
            <label
              key={u.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2',
                picked === u.id
                  ? 'border-accent-border bg-accent-soft'
                  : 'border-border hover:bg-muted'
              )}
            >
              <input
                type="radio"
                name="manager"
                checked={picked === u.id}
                onChange={() => setPicked(u.id)}
                className="h-4 w-4 accent-[#1b4db1]"
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{u.name}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">
                  {u.email}
                </span>
              </span>
              {account.managerId === u.id ? (
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                  Current
                </span>
              ) : null}
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
