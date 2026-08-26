import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActionStatus } from '../types';
import type { ActionItem, Remedy, RootCause, Review } from '../types';
import { seed } from '../data/seed';
import { getVisibleReviews, computeImpact } from '../services/impactAnalysisService';
import { createActionFromRemedy, advanceStatus } from '../services/actionPlanService';

/** Bump when seed/scenario scripting changes; forces a persisted-state auto-reset. */
export const DEMO_VERSION = 1;

interface RIAState {
  // persisted
  currentUserId: string | null;
  activeRestaurantId: string | null;
  actionItems: ActionItem[];
  releasedScenarioIds: string[];
  demoVersion: number;
  // actions
  login: (email: string) => boolean;
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

export const useRIAStore = create<RIAState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      login: (email) => {
        const user = seed.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return false;
        set({ currentUserId: user.id, activeRestaurantId: user.restaurantIds[0] ?? null });
        return true;
      },

      logout: () => set({ currentUserId: null, activeRestaurantId: null }),

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
