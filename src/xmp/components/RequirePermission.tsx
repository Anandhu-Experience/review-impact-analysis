import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { isAllowed, type Gate } from '../lib/permissions';
import { useXmpSession } from '../session';

/**
 * The router-side half of the single permission concept. v2 redirects to
 * /pagenotfound when a route's accessKey is missing, which hides the reason. Saying
 * plainly that the screen exists but this persona cannot open it is more honest and
 * makes the permission model testable by switching persona.
 */
export function RequirePermission({
  gate,
  children,
}: {
  gate?: Gate;
  children: ReactNode;
}) {
  const { session } = useXmpSession();
  if (isAllowed(gate, session)) return <>{children}</>;

  const missing = [
    gate?.accessKey ? `permission "${gate.accessKey}"` : null,
    gate?.app ? `product flag "${gate.app}"` : null,
    gate?.feature ? `feature "${gate.feature}"` : null,
    gate?.personas ? `persona in [${gate.personas.join(', ')}]` : null,
  ].filter(Boolean);

  return (
    <div className="p-10">
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <Lock
          className="mx-auto mb-3 h-6 w-6 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mb-1 text-lg font-semibold">You don't have access to this</h1>
        <p className="text-[13px] text-muted-foreground">
          This screen requires {missing.join(' and ')}.
        </p>
      </div>
    </div>
  );
}
