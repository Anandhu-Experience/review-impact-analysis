import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { Drawer } from '../../components/Drawer';
import {
  ChipMultiSelect,
  FactGrid,
  Field,
  Select,
  TextInput,
} from '../../components/Field';
import { BLUEPRINTS, mockApi, SERVICE_OPTIONS } from '../../lib/api';
import type { Account, Country, NewAccountInput, Organization, Vertical } from '../../lib/types';
import { useXmpSession } from '../../session';

/**
 * ACC-06 New Account + ACC-07 inline Create Organization + ACC-08 inline Add Manager,
 * and ACC-09 Duplicate Account — which in v2 is the same component in a different
 * mode. Ported once with two modes rather than twice.
 */
export function AccountFormDrawer({
  open,
  mode,
  source,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  mode: 'create' | 'duplicate';
  source?: Account | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (a: Account) => void;
}) {
  const { session } = useXmpSession();
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  const [name, setName] = useState('');
  const [vertical, setVertical] = useState('');
  const [category, setCategory] = useState('');
  const [services, setServices] = useState<string[]>(['Reviews']);
  const [blueprint, setBlueprint] = useState(BLUEPRINTS[0]);
  const [orgId, setOrgId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [countryCode, setCountryCode] = useState('US');
  const [timeZone, setTimeZone] = useState('');
  const [addManager, setAddManager] = useState(false);
  const [mgr, setMgr] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      mockApi.listVerticals(),
      mockApi.listCountries(),
      mockApi.listOrganizations(),
    ]).then(([v, c, o]) => {
      setVerticals(v);
      setCountries(c);
      setOrgs(o);
    });
  }, [open]);

  // Duplicate prefills from the source account; create starts empty.
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setError(null);
    setCreatingOrg(false);
    setAddManager(false);
    setMgr({ firstName: '', lastName: '', email: '', phone: '' });
    if (mode === 'duplicate' && source) {
      setName(`${source.name} (copy)`);
      setVertical(source.vertical);
      setCategory(source.category);
      setServices(source.services);
      setBlueprint(source.blueprint);
      setOrgId(source.organizationId ?? '');
      setCountryCode(source.countryCode);
      setTimeZone(source.timeZone);
    } else {
      setName('');
      setVertical('');
      setCategory('');
      setServices(['Reviews']);
      setBlueprint(BLUEPRINTS[0]);
      setOrgId('');
      setCountryCode('US');
      setTimeZone('');
    }
  }, [open, mode, source]);

  const country = useMemo(
    () => countries.find((c) => c.code === countryCode),
    [countries, countryCode]
  );
  const categories = useMemo(
    () => verticals.find((v) => v.name === vertical)?.categories ?? [],
    [verticals, vertical]
  );

  // Time zone depends on country — keep that dependency from v2.
  useEffect(() => {
    if (country && !country.timeZones.includes(timeZone)) {
      setTimeZone(country.timeZones[0]);
    }
  }, [country, timeZone]);

  const nameError = touched && !name.trim() ? 'Account name is required.' : undefined;
  const orgError =
    touched && creatingOrg && !newOrgName.trim()
      ? 'Organization name is required.'
      : undefined;
  const valid = name.trim() && vertical && category && (!creatingOrg || newOrgName.trim());

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    setError(null);
    const input: NewAccountInput = {
      name: name.trim(),
      vertical,
      category,
      services,
      blueprint,
      organizationId: creatingOrg ? null : orgId || null,
      newOrganizationName: creatingOrg ? newOrgName.trim() : undefined,
      countryCode,
      timeZone,
      manager: addManager ? mgr : undefined,
    };
    try {
      const created = await mockApi.createAccount(input);
      onSaved(created);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account');
    } finally {
      setSaving(false);
    }
  };

  // v2: inline org creation is super-admin / onboarding-admin only.
  const canCreateOrg = session.isSuperAdmin;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      width="lg"
      title={mode === 'duplicate' ? 'Duplicate account' : 'New account'}
      description={
        mode === 'duplicate' && source
          ? `Copying configuration from ${source.name}`
          : 'Creates the account in Onboarding. Activate it once setup is complete.'
      }
      footer={
        <>
          <div className="flex-1">
            {error ? <span className="text-[12.5px] text-destructive">{error}</span> : null}
          </div>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={submit} disabled={saving}>
            {saving ? 'Creating…' : mode === 'duplicate' ? 'Create copy' : 'Create account'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Account name" error={nameError}>
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={setName}
              placeholder="e.g. Meridian Home Loans"
              invalid={!!nameError}
            />
          )}
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
                placeholder="Select a vertical"
                options={verticals.map((v) => ({ value: v.name, label: v.name }))}
              />
            )}
          </Field>
          <Field
            label="Category"
            hint={!vertical ? 'Pick a vertical first' : undefined}
          >
            {(id) => (
              <Select
                id={id}
                value={category}
                onChange={setCategory}
                disabled={!vertical}
                placeholder="Select a category"
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Blueprint">
            {(id) => (
              <Select
                id={id}
                value={blueprint}
                onChange={setBlueprint}
                options={BLUEPRINTS.map((b) => ({ value: b, label: b }))}
              />
            )}
          </Field>
          <Field label="Country">
            {(id) => (
              <Select
                id={id}
                value={countryCode}
                onChange={setCountryCode}
                options={countries.map((c) => ({ value: c.code, label: c.name }))}
              />
            )}
          </Field>
        </div>

        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-muted-foreground">Organization</p>
            {canCreateOrg && mode === 'create' ? (
              <button
                type="button"
                onClick={() => setCreatingOrg((v) => !v)}
                className="text-[12px] font-medium text-accent hover:underline"
              >
                {creatingOrg ? 'Choose an existing one' : 'Create new'}
              </button>
            ) : null}
          </div>
          {creatingOrg ? (
            <Field label="New organization name" error={orgError}>
              {(id) => (
                <TextInput
                  id={id}
                  value={newOrgName}
                  onChange={setNewOrgName}
                  placeholder="e.g. Meridian Financial"
                  invalid={!!orgError}
                />
              )}
            </Field>
          ) : (
            <Field label="Assign to organization">
              {(id) => (
                <Select
                  id={id}
                  value={orgId}
                  onChange={setOrgId}
                  placeholder="Unassigned"
                  options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                />
              )}
            </Field>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-muted-foreground">
              First manager
            </p>
            <button
              type="button"
              onClick={() => setAddManager((v) => !v)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
            >
              {addManager ? 'Skip for now' : (
                <>
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  Add a manager
                </>
              )}
            </button>
          </div>
          {addManager ? (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="First name">
                {(id) => (
                  <TextInput
                    id={id}
                    value={mgr.firstName}
                    onChange={(v) => setMgr({ ...mgr, firstName: v })}
                  />
                )}
              </Field>
              <Field label="Last name">
                {(id) => (
                  <TextInput
                    id={id}
                    value={mgr.lastName}
                    onChange={(v) => setMgr({ ...mgr, lastName: v })}
                  />
                )}
              </Field>
              <Field label="Email">
                {(id) => (
                  <TextInput
                    id={id}
                    type="email"
                    value={mgr.email}
                    onChange={(v) => setMgr({ ...mgr, email: v })}
                  />
                )}
              </Field>
              <Field label="Phone">
                {(id) => (
                  <TextInput
                    id={id}
                    value={mgr.phone}
                    onChange={(v) => setMgr({ ...mgr, phone: v })}
                  />
                )}
              </Field>
            </div>
          ) : (
            <p className="text-[11.5px] text-muted-foreground">
              Optional. You can assign a manager from the account list later.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-[12px] font-semibold text-muted-foreground">
            Derived from country
          </p>
          <FactGrid
            facts={[
              { label: 'Time zone', value: timeZone || '—' },
              { label: 'Date format', value: country?.dateFormat ?? '—' },
            ]}
          />
        </div>
      </div>
    </Drawer>
  );
}
