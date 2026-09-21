import * as Menu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/Button';
import { can } from '../../lib/permissions';
import { AccountStatus, type Account } from '../../lib/types';
import { useXmpSession } from '../../session';

export type RowAction =
  | 'settings'
  | 'exception'
  | 'bundles'
  | 'products'
  | 'duplicate'
  | 'assignManager'
  | 'edit'
  | 'suspension'
  | 'activate';

interface Item {
  id: RowAction;
  label: string;
  show: boolean;
  disabled?: boolean;
  /** Why it is disabled — surfaced rather than left a mystery. */
  reason?: string;
  danger?: boolean;
}

/**
 * ACC-05 — the row action menu.
 *
 * v2 puts ELEVEN permission-gated items behind one kebab with no primary action
 * surfaced. Here the two everyday actions are inline on the row (see AccountsPage) and
 * this menu carries the rest, grouped.
 *
 * Two gates are reproduced but deliberately shown as disabled rather than hidden:
 * v2 gates Edit Account and Assign Manager on `item.status !== 1`, i.e. you cannot
 * edit or assign a manager to an ACTIVE account (ActionItem.js:163-187). That looks
 * like a bug rather than a rule. Hiding them would hide the problem; silently enabling
 * them would widen a permission without a decision. So they are visible, disabled, and
 * they say why. Logged for Geetha as a product decision.
 */
export function RowActions({
  account,
  onAction,
}: {
  account: Account;
  onAction: (action: RowAction, account: Account) => void;
}) {
  const { session } = useXmpSession();
  const editPermission = session.isSuperAdmin || session.persona === 'org';

  // v2: every item is disabled for a suspended account unless you are a super admin.
  const lockedBySuspension =
    !session.isSuperAdmin && account.status === AccountStatus.Suspended;

  const activeBlock = account.status === AccountStatus.Active;

  const items: Item[] = [
    {
      id: 'settings',
      label: 'Account settings',
      show: can(session, 'account', 'setting'),
      disabled: true,
      reason: 'AccountSettings module — not ported yet',
    },
    {
      id: 'exception',
      label: account.isException ? 'Remove as exception' : 'Mark as exception',
      show:
        can(session, 'account', account.isException ? 'remove_exception' : 'mark_exception') &&
        (account.status === AccountStatus.Active ||
          account.status === AccountStatus.Onboarding),
    },
    {
      id: 'duplicate',
      label: 'Duplicate account',
      show: can(session, 'account', 'duplicate'),
    },
    {
      id: 'edit',
      label: 'Edit account',
      show: editPermission,
      disabled: activeBlock,
      reason: "v2 blocks editing an Active account (status !== 1) — suspected bug",
    },
    {
      id: 'assignManager',
      label: 'Assign manager',
      show: editPermission,
      disabled: activeBlock,
      reason: "v2 blocks this on an Active account (status !== 1) — suspected bug",
    },
    {
      id: 'activate',
      label: 'Activate account',
      show:
        can(session, 'account', 'activate') &&
        (account.status === AccountStatus.Onboarding ||
          account.status === AccountStatus.Inactive),
    },
    {
      id: 'suspension',
      label:
        account.status === AccountStatus.Suspended
          ? 'Reactivate account'
          : 'Suspend account',
      show:
        session.isSuperAdmin &&
        (account.status === AccountStatus.Active ||
          account.status === AccountStatus.Suspended),
      danger: account.status !== AccountStatus.Suspended,
    },
    {
      id: 'products',
      label: 'Configure products',
      show: editPermission,
      disabled: true,
      reason: 'Organizations module — not ported yet',
    },
    {
      id: 'bundles',
      label: 'Configure bundles',
      show: can(session, 'account', 'bundles'),
      disabled: true,
      reason: 'Bundles module — not ported yet',
    },
  ];

  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" size="icon" aria-label={`More actions for ${account.name}`}>
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-56 rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {visible.map((i) => {
            const disabled = i.disabled || lockedBySuspension;
            return (
              <Menu.Item
                key={i.id}
                disabled={disabled}
                onSelect={() => onAction(i.id, account)}
                title={
                  lockedBySuspension
                    ? 'This account is suspended and is read-only'
                    : i.reason
                }
                className={`flex cursor-pointer flex-col rounded-md px-2.5 py-1.5 text-[13px] outline-none select-none ${
                  disabled
                    ? 'cursor-not-allowed text-muted-foreground opacity-60'
                    : i.danger
                      ? 'text-destructive data-[highlighted]:bg-[#fef3f2]'
                      : 'data-[highlighted]:bg-muted'
                }`}
              >
                <span>{i.label}</span>
                {disabled && (i.reason || lockedBySuspension) ? (
                  <span className="text-[10.5px] leading-tight text-muted-foreground">
                    {lockedBySuspension
                      ? 'Account is suspended — read-only'
                      : i.reason}
                  </span>
                ) : null}
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
