import { ProblemCategory } from '../types';

// Keyword → category map (the fallback classifier when a review has no authored tags).
// includes() on the lowercased comment, so multi-word keys work.
export const CATEGORY_KEYWORDS: Record<ProblemCategory, string[]> = {
  [ProblemCategory.Price]: ['price', 'overpriced', 'expensive', 'pricey', 'cost', 'worth', 'value for', '$'],
  [ProblemCategory.Quality]: ['quality', 'undercooked', 'burnt', 'cold', 'soggy', 'bland', 'stale', 'off', 'watery', 'doughy', 'raw', 'not fresh'],
  [ProblemCategory.Quantity]: ['portion', 'small', 'tiny', 'size', 'hungry', 'skimpy'],
  [ProblemCategory.Taste]: ['taste', 'tasteless', 'flavor', 'flavour', 'seasoning', 'too salty', 'too sweet'],
  [ProblemCategory.Service]: ['service', 'server', 'waiter', 'ignored', 'inattentive', 'refill', 'unfriendly'],
  [ProblemCategory.WaitingTime]: ['wait', 'waited', 'slow', 'minutes', 'hour', 'delay', 'took forever'],
  [ProblemCategory.Availability]: ['unavailable', 'sold out', 'out of', 'ran out', 'no fish', 'no buns', '86'],
  [ProblemCategory.Staff]: ['rude staff', 'staff', 'attitude', 'manager', 'rude'],
  [ProblemCategory.Cleanliness]: ['dirty', 'unclean', 'cleanliness', 'restroom', 'hygiene', 'sticky'],
  [ProblemCategory.Menu]: ['menu', 'options', 'selection', 'few choices'],
  [ProblemCategory.Ambience]: ['ambience', 'ambiance', 'noise', 'loud', 'lighting', 'decor', 'atmosphere', 'music'],
  [ProblemCategory.Delivery]: ['delivery', 'delivered', 'driver', 'arrived late', 'courier'],
  [ProblemCategory.Packaging]: ['packaging', 'container', 'leak', 'spilled', 'box'],
};

export const POSITIVE_WORDS = [
  'great', 'fresh', 'fast', 'quick', 'delicious', 'tasty', 'excellent', 'best', 'love', 'perfect',
  'generous', 'hot', 'friendly', 'attentive', 'value', 'crisp', 'crispy', 'nice', 'solid', 'reliable',
  'speedy', 'worth', 'improvement', 'better', 'welcoming', 'in stock',
];

export const NEGATIVE_WORDS = [
  'cold', 'slow', 'waited', 'overpriced', 'small', 'tiny', 'rude', 'soggy', 'bland', 'burnt',
  'undercooked', 'doughy', 'poor', 'watery', 'ignored', 'unavailable', 'sold out', 'ran out',
  'hungry', 'mushy', 'off', 'not fresh', 'not worth', 'gave up',
];

// Positive-theme phrases for extractPositiveThemes (peer 4–5★ mining).
export const POSITIVE_THEMES: Array<{ phrase: string; label: string }> = [
  { phrase: 'fresh', label: 'fresh' },
  { phrase: 'hot', label: 'hot & fresh' },
  { phrase: 'generous', label: 'generous portion' },
  { phrase: 'value', label: 'great value' },
  { phrase: 'quick', label: 'quick service' },
  { phrase: 'fast', label: 'fast service' },
  { phrase: 'no wait', label: 'no wait' },
  { phrase: 'friendly', label: 'friendly staff' },
  { phrase: 'attentive', label: 'attentive staff' },
  { phrase: 'crisp', label: 'crisp & fresh' },
  { phrase: 'in stock', label: 'always in stock' },
  { phrase: 'reliable', label: 'reliable quality' },
];

const NEGATIVE_THEMES: Array<{ phrase: string; label: string }> = [
  { phrase: 'cold', label: 'cold food' },
  { phrase: 'slow', label: 'slow' },
  { phrase: 'wait', label: 'long wait' },
  { phrase: 'small', label: 'small portion' },
  { phrase: 'overpriced', label: 'overpriced' },
  { phrase: 'soggy', label: 'soggy' },
  { phrase: 'doughy', label: 'doughy' },
  { phrase: 'rude', label: 'rude service' },
  { phrase: 'sold out', label: 'sold out' },
  { phrase: 'unavailable', label: 'unavailable' },
];

const lc = (s: string) => s.toLowerCase();

export function matchLexicon(comment: string): ProblemCategory[] {
  const c = lc(comment);
  const hits: ProblemCategory[] = [];
  (Object.keys(CATEGORY_KEYWORDS) as ProblemCategory[]).forEach((cat) => {
    if (CATEGORY_KEYWORDS[cat].some((k) => c.includes(k))) hits.push(cat);
  });
  return hits;
}

export function countLexiconHits(comment: string): { pos: number; neg: number } {
  const c = lc(comment);
  const pos = POSITIVE_WORDS.reduce((a, w) => a + (c.includes(w) ? 1 : 0), 0);
  const neg = NEGATIVE_WORDS.reduce((a, w) => a + (c.includes(w) ? 1 : 0), 0);
  return { pos, neg };
}

export function extractThemes(comments: string[], positive: boolean): string[] {
  const list = positive ? POSITIVE_THEMES : NEGATIVE_THEMES;
  const counts = new Map<string, number>();
  for (const raw of comments) {
    const c = lc(raw);
    for (const { phrase, label } of list) {
      if (c.includes(phrase)) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
}
