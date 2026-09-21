import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Drawer } from '../../components/Drawer';
import { Field, TextArea } from '../../components/Field';
import { mockApi } from '../../lib/api';
import { AccountStatus, type Account } from '../../lib/types';

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-[#fedf89] bg-[#fffaeb] p-3.5">
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-[#b54708]"
        aria-hidden="true"
      />
      <div className="text-[12.5px] leading-relaxed text-[#93370d]">{children}</div>
    </div>
  );
}

function useAction(onDone: (a: Account) => void, close: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<Account>) => {
    setBusy(true);
    setError(null);
    try {
      onDone(await fn());
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

/**
 * ACC-11 + ACC-12 merged. v2 has TWO activate flows — a drawer from the row menu and a
 * separate one behind the Onboarding badge — two components for one outcome. One here.
 */
export function ActivateDrawer({
  account,
  onOpenChange,
  onDone,
}: {
  account: Account | null;
  onOpenChange: (o: boolean) => void;
  onDone: (a: Account) => void;
}) {
  const { busy, error, run } = useAction(onDone, () => onOpenChange(false));
  if (!account) return null;
  return (
    <Drawer
      open
      onOpenChange={onOpenChange}
      title="Activate account"
      description={account.name}
      footer={
        <>
          <div className="flex-1">
            {error ? <span className="text-[12.5px] text-destructive">{error}</span> : null}
          </div>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={busy}
            onClick={() => run(() => mockApi.activateAccount(account.id))}
          >
            {busy ? 'Activating…' : 'Activate'}
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed">
        Activating makes {account.name} live. Its users can sign in, public pages
        publish, and campaigns begin sending.
      </p>
      <p className="mt-3 text-[12.5px] text-muted-foreground">
        Currently {account.status === AccountStatus.Onboarding ? 'onboarding' : 'inactive'}
        {account.tiers > 0 ? ` with ${account.tiers} tiers and ${account.users} users` : ''}.
      </p>
    </Drawer>
  );
}

/** ACC-14 — Add / Remove Exception. */
export function ExceptionDrawer({
  account,
  onOpenChange,
  onDone,
}: {
  account: Account | null;
  onOpenChange: (o: boolean) => void;
  onDone: (a: Account) => void;
}) {
  const { busy, error, run } = useAction(onDone, () => onOpenChange(false));
  if (!account) return null;
  const marking = !account.isException;
  return (
    <Drawer
      open
      onOpenChange={onOpenChange}
      title={marking ? 'Mark as exception' : 'Remove exception'}
      description={account.name}
      footer={
        <>
          <div className="flex-1">
            {error ? <span className="text-[12.5px] text-destructive">{error}</span> : null}
          </div>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={busy}
            onClick={() => run(() => mockApi.setException(account.id, marking))}
          >
            {busy ? 'Saving…' : marking ? 'Mark as exception' : 'Remove exception'}
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed">
        {marking
          ? 'Exception accounts are excluded from standard reporting and billing rollups, and carry an EX tag in the account list.'
          : 'This account will return to standard reporting and billing rollups.'}
      </p>
    </Drawer>
  );
}

/** ACC-15 — Suspend / Reactivate. Reason is mandatory when suspending. */
export function SuspensionDrawer({
  account,
  onOpenChange,
  onDone,
}: {
  account: Account | null;
  onOpenChange: (o: boolean) => void;
  onDone: (a: Account) => void;
}) {
  const { busy, error, run } = useAction(onDone, () => onOpenChange(false));
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setReason('');
    setTouched(false);
  }, [account?.id]);

  if (!account) return null;
  const suspending = account.status !== AccountStatus.Suspended;
  const reasonError =
    suspending && touched && !reason.trim() ? 'A reason is required.' : undefined;

  return (
    <Drawer
      open
      onOpenChange={onOpenChange}
      title={suspending ? 'Suspend account' : 'Reactivate account'}
      description={account.name}
      footer={
        <>
          <div className="flex-1">
            {error ? <span className="text-[12.5px] text-destructive">{error}</span> : null}
          </div>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={busy}
            onClick={() => {
              setTouched(true);
              if (suspending && !reason.trim()) return;
              void run(() => mockApi.setSuspension(account.id, suspending, reason.trim()));
            }}
          >
            {busy ? 'Working…' : suspending ? 'Suspend account' : 'Reactivate account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {suspending ? (
          <Warning>
            Suspension puts the entire account into a read-only state. Users can sign in
            but cannot change anything, and every screen across XMP respects it.
          </Warning>
        ) : (
          <p className="text-[13px] leading-relaxed">
            Reactivating restores write access for every user in this account.
          </p>
        )}

        {account.suspensionReason && !suspending ? (
          <div className="rounded-lg border border-border bg-muted p-3">
            <div className="text-[11px] text-muted-foreground">Suspended because</div>
            <div className="text-[13px]">{account.suspensionReason}</div>
          </div>
        ) : null}

        {suspending ? (
          <Field label="Reason for suspension" error={reasonError}>
            {(id) => (
              <TextArea
                id={id}
                value={reason}
                onChange={setReason}
                invalid={!!reasonError}
                placeholder="Shown to admins as a tooltip on the account's status."
              />
            )}
          </Field>
        ) : null}
      </div>
    </Drawer>
  );
}

/** ACC-13 — Deactivation request: approve or reject. Reason mandatory on reject. */
export function DeactivationDecisionDrawer({
  account,
  onOpenChange,
  onDone,
}: {
  account: Account | null;
  onOpenChange: (o: boolean) => void;
  onDone: (a: Account) => void;
}) {
  const { busy, error, run } = useAction(onDone, () => onOpenChange(false));
  const [approve, setApprove] = useState(true);
  const [comments, setComments] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setApprove(true);
    setComments('');
    setTouched(false);
  }, [account?.id]);

  if (!account) return null;
  const commentError =
    !approve && touched && !comments.trim()
      ? 'A reason is required when rejecting.'
      : undefined;

  return (
    <Drawer
      open
      onOpenChange={onOpenChange}
      title="Deactivation request"
      description={account.name}
      footer={
        <>
          <div className="flex-1">
            {error ? <span className="text-[12.5px] text-destructive">{error}</span> : null}
          </div>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={busy}
            onClick={() => {
              setTouched(true);
              if (!approve && !comments.trim()) return;
              void run(() =>
                mockApi.decideDeactivation(account.id, approve, comments.trim())
              );
            }}
          >
            {busy ? 'Submitting…' : approve ? 'Approve deactivation' : 'Reject request'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Warning>
          Approving deactivates every tier and user under this account and unpublishes
          all of its public pages.
        </Warning>

        <fieldset>
          <legend className="mb-2 text-[12px] font-medium text-muted-foreground">
            Decision
          </legend>
          <div className="space-y-1.5">
            {[
              { v: true, label: 'Approve', hint: 'Deactivate the account' },
              { v: false, label: 'Reject', hint: 'Keep the account active' },
            ].map((o) => (
              <label
                key={String(o.v)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  approve === o.v
                    ? 'border-accent-border bg-accent-soft'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={approve === o.v}
                  onChange={() => setApprove(o.v)}
                  className="h-4 w-4 accent-[#1b4db1]"
                />
                <span>
                  <span className="block text-[13px] font-semibold">{o.label}</span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    {o.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label={approve ? 'Comments (optional)' : 'Reason for rejection'}
          error={commentError}
        >
          {(id) => (
            <TextArea
              id={id}
              value={comments}
              onChange={setComments}
              invalid={!!commentError}
            />
          )}
        </Field>
      </div>
    </Drawer>
  );
}
