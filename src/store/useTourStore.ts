import { create } from 'zustand';
import { TOUR_STEPS, type TourStep } from '../components/tour/tourSteps';

const SEEN_KEY = 'ria-tour-v1-seen';

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Unavailable storage just means the tour replays every session — harmless.
  }
}

interface TourState {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  /** Has the tour ever been started-and-closed on this browser? Gates auto-start only. */
  seen: boolean;
  start: (hasAnalysis: boolean) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIndex: 0,
  steps: [],
  seen: readSeen(),

  // Analysis needs a top negative review to land on; skip those steps when there is none.
  start: (hasAnalysis) => {
    const steps = hasAnalysis ? TOUR_STEPS : TOUR_STEPS.filter((s) => s.route !== '/analysis');
    set({ active: true, stepIndex: 0, steps });
  },

  next: () => {
    const { stepIndex, steps } = get();
    if (stepIndex >= steps.length - 1) {
      get().stop();
      return;
    }
    set({ stepIndex: stepIndex + 1 });
  },

  prev: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),

  stop: () => {
    writeSeen();
    set({ active: false, seen: true });
  },
}));
