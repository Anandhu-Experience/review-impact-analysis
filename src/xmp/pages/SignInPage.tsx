import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import type { Persona } from '../lib/permissions';
import { cn } from '../lib/utils';
import {
  PERSONA_LABEL,
  PERSONA_LANDING,
  PERSONA_SOURCE,
  PERSONAS,
  useXmpSession,
} from '../session';

/**
 * Sign-in — a P0 parity screen. v2 has three of these (/admin/signin, /user/signin,
 * /xpa/signin) rendering different components for what is one job.
 *
 * Auth itself is not built yet (no Supabase, no RLS), so what a password would decide
 * in production — which persona you are, and therefore where you land and what you
 * can see — is chosen explicitly here instead. Each persona lands on the route v2
 * declares for it in DEFAULT_ROUTES.
 */
export default function SignInPage() {
  const { signIn, signedIn, persona: current } = useXmpSession();
  const navigate = useNavigate();
  const [persona, setPersona] = useState<Persona>('admin');

  if (signedIn) return <Navigate to={PERSONA_LANDING[current]} replace />;

  const submit = () => {
    signIn(persona);
    navigate(PERSONA_LANDING[persona]);
  };

  return (
    <div className="xmp-root flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-lg font-bold tracking-tight">XMP</span>
            <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent">
              new shell
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Experience.com — parity port of today's XMP
          </p>
        </div>

        <fieldset className="mb-5">
          <legend className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Sign in as
          </legend>
          <div className="space-y-1.5">
            {PERSONAS.map((p) => (
              <label
                key={p}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                  persona === p
                    ? 'border-accent-border bg-accent-soft'
                    : 'border-border hover:bg-muted'
                )}
              >
                <input
                  type="radio"
                  name="persona"
                  value={p}
                  checked={persona === p}
                  onChange={() => setPersona(p)}
                  className="h-4 w-4 accent-[#1b4db1]"
                />
                <span className="flex-1">
                  <span className="block text-[13px] font-semibold">
                    {PERSONA_LABEL[p]}
                  </span>
                  <span className="block font-mono text-[10.5px] text-muted-foreground">
                    lands on {PERSONA_LANDING[p]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button variant="primary" size="md" className="w-full" onClick={submit}>
          Sign in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>

        <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Landing routes are taken from v2's own{' '}
          <span className="font-mono">DEFAULT_ROUTES</span> —{' '}
          {PERSONA_SOURCE[persona]}. Real auth (Supabase + row-level security) replaces
          this screen; RLS will change what the API returns, not just what the UI shows.
        </p>
      </div>
    </div>
  );
}
