import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActionStatus } from '../types';
import type { ActionItem, Remedy, RootCause, Review } from '../types';
import { seed } from '../data/seed';
import { getVisibleReviews, computeImpact } from '../services/impactAnalysisService';
import { createActionFromRemedy, advanceStatus } from '../services/actionPlanService';
import { fetchOwner, isSupabaseConfigured, supabase } from '../lib/supabase';

/** Bump when seed/scenario scripting changes; forces a persisted-state auto-reset. */
export const DEMO_VERSION = 1;

interface RIAState {
  // persisted
  currentUserId: string | null;
  activeRestaurantId: string | null;
  actionItems: ActionItem[];
  releasedScenarioIds: string[];
  demoVersion: number;
  // session (never persisted — derived from Supabase, or immediate when it is not configured)
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  // actions
  login: (email: string) => boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  initAuth: () => void;
  logout: () => void;
  setActiveRestaurant: (id: string) => void;
  createAction: (args: { remedy: Remedy; rootCause: RootCause; scenarioId: string }) => void;
  updateActionStatus: (actionId: string, status: ActionStatus) => void;
  collectNewReviews: (actionId: string) => void;
  resetDemo: () => void;
}

const INITIAL = {
  currentUserId: null as string | null,
  activeRestaurantId: null as string | null,
  actionItems: [] as ActionItem[],
  releasedScenarioIds: [] as string[],
  demoVersion: DEMO_VERSION,
};

/** Signing in only establishes who you are; this is what the app reads afterwards. */
function localIdentity(userId: string) {
  return {
    currentUserId: userId,
    activeRestaurantId: seed.users.find((u) => u.id === userId)?.restaurantIds[0] ?? null,
  };
}

type SetState = (partial: Partial<RIAState>) => void;

/**
 * Supabase surfaces an unreachable project as the browser's bare "Failed to fetch", which
 * tells you nothing about which of the two likely causes it is.
 */
function readableAuthError(message: string): string {
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Could not reach Supabase. Check VITE_SUPABASE_URL in .env and your connection.';
  }
  return message;
}

/**
 * Turns an authenticated session into the demo's owner identity.
 *
 * The seeded `owners` table uses the same ids as src/data/users.ts, so one RLS-scoped select
 * (which can only ever return the caller's own row) resolves straight to the local data the
 * rest of the app reads. An account with no owner row is the case worth reporting rather
 * than dropping someone into an app with nothing in it.
 */
async function adoptOwner(set: SetState): Promise<boolean> {
  try {
    const owner = await fetchOwner();
    const user = owner
      ? seed.users.find((u) => u.id === owner.id) ??
        seed.users.find((u) => u.email.toLowerCase() === owner.email.toLowerCase())
      : undefined;

    if (!user) {
      await supabase?.auth.signOut();
      set({
        authBusy: false,
        currentUserId: null,
        activeRestaurantId: null,
        authError: owner
          ? `Signed in as ${owner.email}, but this build reads restaurant data from the local seed and has none for that owner.`
          : 'This account is not linked to an owner. Sign up with one of the seeded owner emails, or link the account in the owners table.',
      });
      return false;
    }

    set({ ...localIdentity(user.id), authBusy: false, authError: null });
    return true;
  } catch (e) {
    set({
      authBusy: false,
      authError: e instanceof Error ? readableAuthError(e.message) : 'Could not load your owner profile.',
    });
    return false;
  }
}

export const useRIAStore = create<RIAState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      authReady: !isSupabaseConfigured, // nothing to wait for in the offline demo
      authBusy: false,
      authError: null,

      // Offline path: no auth at all, the email just picks an owner. Kept so the demo still
      // runs with no .env and no network.
      login: (email) => {
        const user = seed.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return false;
        set(localIdentity(user.id));
        return true;
      },

      signIn: async (email, password) => {
        if (!supabase) return get().login(email);
        set({ authBusy: true, authError: null });
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          set({ authBusy: false, authError: readableAuthError(error.message) });
          return false;
        }
        return adoptOwner(set);
      },

      signUp: async (email, password) => {
        if (!supabase) return get().login(email);
        set({ authBusy: true, authError: null });
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) {
          set({ authBusy: false, authError: readableAuthError(error.message) });
          return false;
        }
        // No session on a successful sign-up means the project still requires email
        // confirmation — which the seeded owners can never complete, since .test addresses
        // are reserved and undeliverable by design.
        if (!data.session) {
          set({
            authBusy: false,
            authError:
              'Account created but not signed in — this project still has email confirmation on. ' +
              'Turn it off under Authentication → Sign In / Providers → Email, or use a real address.',
          });
          return false;
        }
        return adoptOwner(set);
      },

      // Called once at boot. With Supabase on, the session — not the persisted blob — decides
      // who is signed in, so a stale currentUserId from an offline run cannot outlive it.
      initAuth: () => {
        if (!supabase) {
          set({ authReady: true });
          return;
        }
        void supabase.auth.getSession().then(async ({ data }) => {
          if (data.session) await adoptOwner(set);
          else set({ currentUserId: null, activeRestaurantId: null });
          set({ authReady: true });
        });
        supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') set({ currentUserId: null, activeRestaurantId: null });
        });
      },

      logout: () => {
        set({ currentUserId: null, activeRestaurantId: null, authError: null });
        if (supabase) void supabase.auth.signOut();
      },

      setActiveRestaurant: (id) => set({ activeRestaurantId: id }),

      createAction: ({ remedy, rootCause, scenarioId }) => {
        const { activeRestaurantId, actionItems, currentUserId } = get();
        if (!activeRestaurantId) return;
        const owner = seed.users.find((u) => u.id === currentUserId)?.name ?? 'Owner';
        const action = createActionFromRemedy(remedy, rootCause, activeRestaurantId, owner, scenarioId, seed);
        if (actionItems.some((a) => a.id === action.id)) return; // idempotent (dedupe on remedy)
        set({ actionItems: [...actionItems, action] });
      },

      updateActionStatus: (actionId, status) =>
        set((s) => ({ actionItems: s.actionItems.map((a) => (a.id === actionId ? advanceStatus(a, status) : a)) })),

      // The before/after crux: release the scenario, recompute impact from now-visible data.
      collectNewReviews: (actionId) => {
        const { actionItems, releasedScenarioIds } = get();
        const action = actionItems.find((a) => a.id === actionId);
        if (!action) return;
        const released = releasedScenarioIds.includes(action.scenarioId)
          ? releasedScenarioIds
          : [...releasedScenarioIds, action.scenarioId];
        const impact = computeImpact(action, seed, released);
        const nextStatus: ActionStatus =
          impact.verdict === 'Improvement Confirmed'
            ? ActionStatus.ImprovementConfirmed
            : impact.verdict === 'No Significant Improvement'
              ? ActionStatus.NoSignificantChange
              : ActionStatus.Monitoring;
        set({
          releasedScenarioIds: released,
          actionItems: actionItems.map((a) =>
            a.id === actionId ? { ...a, afterSnapshot: impact.after, impactResult: impact, status: nextStatus } : a,
          ),
        });
      },

      // Clear demo progress (actions + released reviews) but keep the session signed in.
      resetDemo: () => set({ actionItems: [], releasedScenarioIds: [], demoVersion: DEMO_VERSION }),
    }),
    {
      name: 'ria-store-v1',
      version: DEMO_VERSION,
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        activeRestaurantId: s.activeRestaurantId,
        actionItems: s.actionItems,
        releasedScenarioIds: s.releasedScenarioIds,
        demoVersion: s.demoVersion,
      }),
      migrate: (persisted: any, version) => {
        // Auto-reset if the persisted blob predates the current demo scripting.
        if (!persisted || version !== DEMO_VERSION || persisted.demoVersion !== DEMO_VERSION) return { ...INITIAL };
        return persisted;
      },
    },
  ),
);

/**
 * Uniform review gate. getVisibleReviews returns a fresh array each call, so we select the two
 * primitive inputs and memoize — selecting the array directly would re-render on every store change.
 */
export const useVisibleReviews = (): Review[] => {
  const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId);
  const releasedScenarioIds = useRIAStore((s) => s.releasedScenarioIds);
  return useMemo(
    () => (activeRestaurantId ? getVisibleReviews(activeRestaurantId, releasedScenarioIds, seed) : []),
    [activeRestaurantId, releasedScenarioIds],
  );
};
