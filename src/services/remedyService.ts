import type { ProblemCategory, Remedy, RootCause } from '../types';
import { remedyTable } from '../data/remedyTable';

export function mapProblemToRemedies(category: ProblemCategory): Remedy[] {
  return remedyTable[category] ?? [];
}

// Tier-1 remedy for the category (rootCause could bias the pick; MVP has one tier-1 each).
export function getRemedy(category: ProblemCategory, _rootCause?: RootCause): Remedy {
  const list = mapProblemToRemedies(category);
  const r = list.find((x) => x.tier === 1) ?? list[0];
  if (!r) throw new Error(`remedyService: no remedy for category ${category}`);
  return r;
}

// The next remedy (tier 2) when tier 1 was tried and failed — the failed-remedy loop.
export function getNextRemedy(category: ProblemCategory, excludeRemedyId: string): Remedy | undefined {
  return mapProblemToRemedies(category).find((x) => x.id !== excludeRemedyId);
}
