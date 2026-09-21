import * as Popover from '@radix-ui/react-popover';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { mockApi, STATUS_OPTIONS } from '../../lib/api';
import type { AccountStatusCode, Organization } from '../../lib/types';

export interface Filters {
  status: AccountStatusCode[];
  organizationId: string;
}

export const EMPTY_FILTERS: Filters = { status: [], organizationId: '' };

/**
 * ACC-03 — the filter surface.
 *
 * v2 hides these in a side panel behind a toggle, with a single global Clear and no
 * indication of what is applied once it is closed. Here the applied filters live as
 * removable chips on the toolbar (rendered by AccountsPage) and this popover is only
 * where you add them. Status codes stay numeric in the data; the UI shows labels.
 */
export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void mockApi.listOrganizations().then(setOrgs);
  }, []);

  const toggleStatus = (s: AccountStatusCode) =>
    onChange({
      ...filters,
      status: filters.status.includes(s)
        ? filters.status.filter((x) => x !== s)
        : [...filters.status, s],
    });

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-input px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add filter
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-72 rounded-lg border border-border bg-card p-4 shadow-lg"
        >
          <fieldset className="mb-4">
            <legend className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Status
            </legend>
            <div className="space-y-1">
              {STATUS_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-[13px] hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(o.value)}
                    onChange={() => toggleStatus(o.value)}
                    className="h-4 w-4 accent-[#1b4db1]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mb-4">
            <label
              htmlFor="filter-org"
              className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Organization
            </label>
            <select
              id="filter-org"
              value={filters.organizationId}
              onChange={(e) => onChange({ ...filters, organizationId: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All organizations</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
              Clear all
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
