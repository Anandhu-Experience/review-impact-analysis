import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;

// Supabase replaced the legacy anon JWT with publishable keys (sb_publishable_…). Projects
// exist on both sides of that change, so take whichever the environment supplies.
const publicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase is opt-in. With no env vars the app runs exactly as it always has — seed data,
 * mock owner switch, no network — which is what keeps the offline demo deterministic and
 * the QA plan's locked numbers meaningful. With them, real auth decides who you are.
 */
export const isSupabaseConfigured = Boolean(url && publicKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, publicKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // no OAuth redirect flow in this app yet
      },
    })
  : null;

/** The owner row belonging to the signed-in user, or null when the account is unlinked. */
export interface OwnerRow {
  id: string;
  name: string;
  email: string;
}

/**
 * Resolves the session to an owner. RLS restricts `owners` to the caller's own row, so a
 * single unfiltered select returns exactly one row when the signup trigger has linked the
 * account, and none when it has not — which is the case worth reporting to the user rather
 * than silently signing them into an empty app.
 */
export async function fetchOwner(): Promise<OwnerRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('owners').select('id, name, email').limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}
