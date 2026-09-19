import { LogOut } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import type { Persona } from '../lib/permissions';
import { isAllowed } from '../lib/permissions';
import { cn } from '../lib/utils';
import { SCREENS } from '../registry';
import { PERSONA_LABEL, PERSONAS, useXmpSession } from '../session';

export function XmpShell() {
  const { session, persona, setPersona, signOut } = useXmpSession();

  // Nav is DERIVED from the registry, so it cannot advertise a screen that does not
  // exist — the failure mode that leaves six dead links in v2 today.
  const items = SCREENS.filter((s) => s.nav && isAllowed(s.gate, session)).sort(
    (a, b) => a.nav!.order - b.nav!.order
  );

  return (
    <div className="xmp-root flex h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-muted">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <span className="text-sm font-bold tracking-tight">XMP</span>
          <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent">
            new shell
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-auto p-3" aria-label="XMP main">
          {items.map((s) => {
            const Icon = s.nav!.icon;
            return (
              <NavLink
                key={s.id}
                to={s.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{s.nav!.label}</span>
                {s.parity === 'planned' ? (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#f79009]"
                    title="Not yet at parity"
                  />
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <label
            htmlFor="xmp-persona"
            className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            View as
          </label>
          <select
            id="xmp-persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
            className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PERSONAS.map((p) => (
              <option key={p} value={p}>
                {PERSONA_LABEL[p]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            {items.length} of {SCREENS.length} screens visible to this persona
          </p>

          <button
            type="button"
            onClick={signOut}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
