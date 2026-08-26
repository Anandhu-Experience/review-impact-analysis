import { ActionStatus, Priority, ReviewPhase } from '../types';
import type { ActionItem, Remedy, RootCause } from '../types';
import type { SeedData } from '../data/seed';
import { captureSnapshot } from './impactAnalysisService';

// Pure ISO date add (no `new Date` — determinism rule / QA grep).
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function addDaysISO(iso: string, add: number): string {
  const [y0, m0, d0] = iso.split('-').map(Number);
  let y = y0, m = m0, d = d0 + add;
  for (;;) {
    const dim = m === 2 && isLeap(y) ? 29 : DIM[m - 1];
    if (d <= dim) break;
    d -= dim;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Materialize a chosen Remedy (+ its RootCause) into a tracked ActionItem, capturing the
// baseline snapshot up front. Deterministic dates derived from the scenario's actionDate.
export function createActionFromRemedy(
  remedy: Remedy,
  rootCause: RootCause,
  restaurantId: string,
  owner: string,
  scenarioId: string,
  data: SeedData,
): ActionItem {
  const scenario = data.scenarios.find((s) => s.id === scenarioId);
  const createdDate = scenario?.actionDate ?? '2026-03-01';
  const targetDate = addDaysISO(createdDate, 14);
  const priority = remedy.tier === 2 ? Priority.High : rootCause.confidence >= 0.75 ? Priority.High : Priority.Medium;
  const beforeSnapshot = scenario ? captureSnapshot(restaurantId, scenario, ReviewPhase.Baseline, data) : undefined;

  return {
    id: `act-${scenarioId}-${remedy.id}`,
    restaurantId,
    remedyId: remedy.id,
    rootCauseId: rootCause.id,
    scenarioId,
    action: remedy.title,
    category: remedy.category,
    owner,
    priority,
    status: ActionStatus.NotStarted,
    createdDate,
    targetDate,
    beforeSnapshot,
  };
}

// Pure status transition.
export function advanceStatus(action: ActionItem, newStatus: ActionStatus): ActionItem {
  return { ...action, status: newStatus };
}

export function summarizeActionPlan(actions: ActionItem[]) {
  const byStatus = {} as Record<ActionStatus, number>;
  for (const s of Object.values(ActionStatus)) byStatus[s] = 0;
  for (const a of actions) byStatus[a.status] += 1;
  const terminal = byStatus[ActionStatus.ImprovementConfirmed] + byStatus[ActionStatus.NoSignificantChange];
  return {
    total: actions.length,
    byStatus,
    monitoring: byStatus[ActionStatus.Monitoring],
    inProgress: byStatus[ActionStatus.InProgress],
    confirmed: byStatus[ActionStatus.ImprovementConfirmed],
    completionRate: actions.length ? Math.round((terminal / actions.length) * 100) : 0,
  };
}
