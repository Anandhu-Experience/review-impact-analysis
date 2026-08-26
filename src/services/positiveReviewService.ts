import type { PositiveReviewComparison, ProblemCategory, Review } from '../types';
import type { SeedData } from '../data/seed';
import { extractThemes } from './lexicon';

// Positive-theme phrases from a set of reviews.
export function extractPositiveThemes(reviews: Review[]): string[] {
  return extractThemes(reviews.map((r) => r.comment), true);
}

// Mine 4–5★ peer reviews of the same catalog item; contrast with my negatives that mention the category.
export function findPositiveComparisons(
  restaurantId: string,
  category: ProblemCategory,
  catalogItemId: string,
  data: SeedData,
): PositiveReviewComparison | null {
  const peerPositives = data.reviews.filter(
    (r) => r.catalogItemId === catalogItemId && r.restaurantId !== restaurantId && r.rating >= 4 && r.phase === 'baseline',
  );
  if (peerPositives.length === 0) return null;

  const positiveThemes = extractPositiveThemes(peerPositives);
  const positiveExampleIds = [...peerPositives].sort((a, b) => b.rating - a.rating).slice(0, 3).map((r) => r.id);

  const myNegatives = data.reviews.filter(
    (r) => r.restaurantId === restaurantId && r.catalogItemId === catalogItemId && r.rating < 3 && (r.tags?.categories.includes(category) ?? true),
  );
  const negativeThemes = extractThemes(myNegatives.map((r) => r.comment), false);

  const posLead = positiveThemes.slice(0, 2).join(', ') || 'consistent quality';
  const negLead = negativeThemes.slice(0, 2).join(', ') || 'the opposite';
  const contrast = `Peers' happy customers praise ${posLead} on the same dish, while yours cite ${negLead}.`;

  return { category, positiveThemes, negativeThemes, positiveExampleIds, contrast };
}
