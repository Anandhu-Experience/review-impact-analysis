import { Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { Drawer } from '../../components/Drawer';
import { ChipMultiSelect, FactGrid, Field, Select, TextInput } from '../../components/Field';
import { mockApi, SERVICE_OPTIONS } from '../../lib/api';
import type { Account, Country, Vertical } from '../../lib/types';
import { useXmpSession } from '../../session';

/**
 * ACC-10 Edit Account — redesigned.
 *
 * v2 renders seven fields of which FOUR are permanently disabled (Blueprint, Country,
 * Date Format, and Time Zone for anyone but a super admin). Reproducing that faithfully
 * is the failure mode the brief names, so immutable attributes are shown as facts and
 * only what can actually change is a field.
 */
export function EditAccountDrawer({
  account,
  onOpenChange,
  onSaved,
}: {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (a: Account) => void;
}) {
  const { session } = useXmpSession();
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  const [name, setName] = useState('');
  const [vertical, setVertical] = useState('');
  const [category, setCategory] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [timeZone, setTimeZone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = account !== null;

  useEffect(() => {
    if (!open) return;
    void Promise.all([mockApi.listVerticals(), mockApi.listCountries()]).then(
      ([v, c]) => {
        setVerticals(v);
        setCountries(c);
      }
    );
  }, [open]);

  useEffect(() => {
    if (!account) return;
    setName(account.name);
    setVertical(account.vertical);
    setCategory(account.category);
    setServices(account.services);
    setTimeZone(account.timeZone);
    setError(null);
  }, [account]);

  const country = useMemo(
    () => countries.find((c) => c.code === account?.countryCode),
    [countries, account]
  );
  const categories = useMemo(
    () => verticals.find((v) => v.name === vertical)?.categories ?? [],
    [verticals, vertical]
  );

  if (!account) return null;

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await mockApi.updateAccount(account.id, {
        name: name.trim(),
        vertical,
        category,
        services,
        timeZone,
      });
      onSaved(saved);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Edit account"
      description={account.name}
      footer={
        <>
          <div className="flex-1">
            {error ? <span className="text-[12.5px] text-destructive">{error}</span> : null}
          </div>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Account name">
          {(id) => <TextInput id={id} value={name} onChange={setName} />}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Vertical">
            {(id) => (
              <Select
                id={id}
                value={vertical}
                onChange={(v) => {
                  setVertical(v);
                  setCategory('');
                }}
                options={verticals.map((v) => ({ value: v.name, label: v.name }))}
              />
            )}
          </Field>
          <Field label="Category">
            {(id) => (
              <Select
                id={id}
                value={category}
                onChange={setCategory}
                options={categories.map((c) => ({ value: c, label: c }))}
              />
            )}
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">
            Products and services
          </p>
          <ChipMultiSelect
            options={SERVICE_OPTIONS}
            selected={services}
            onToggle={(s) =>
              setServices((cur) =>
                cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
              )
            }
          />
        </div>

        {/* Time zone is genuinely editable, but only by a super admin — so it is a
            field for them and a fact for everyone else, never a dead input. */}
        {session.isSuperAdmin ? (
          <Field label="Time zone" hint="Super admins only">
            {(id) => (
              <Select
                id={id}
                value={timeZone}
                onChange={setTimeZone}
                options={(country?.timeZones ?? [timeZone]).map((t) => ({
                  value: t,
                  label: t,
                }))}
              />
            )}
          </Field>
        ) : null}

        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-[12px] font-semibold text-muted-foreground">
              Fixed when the account was created
            </span>
          </div>
          <p className="mb-3 text-[11.5px] leading-relaxed text-muted-foreground">
            These cannot change without migrating the account, so they are shown as facts
            rather than as inputs that refuse to work.
          </p>
          <FactGrid
            facts={[
              { label: 'Blueprint', value: account.blueprint },
              { label: 'Country', value: country?.name ?? account.countryCode },
              { label: 'Date format', value: country?.dateFormat ?? '—' },
              ...(session.isSuperAdmin
                ? []
                : [{ label: 'Time zone', value: account.timeZone }]),
            ]}
          />
        </div>
      </div>
    </Drawer>
  );
}
