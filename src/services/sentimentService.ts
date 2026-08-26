import { Sentiment } from '../types';
import type { Review } from '../types';
import { countLexiconHits } from './lexicon';
import { SENTIMENT_ANCHOR, SENTIMENT_NUDGE, SENTIMENT_POS_CUT, SENTIMENT_NEG_CUT } from './thresholds';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// One review → a Sentiment label + a numeric score in [-1, 1].
// Authored tags win (deterministic demo); lexicon only nudges magnitude, never sign.
export function scoreSentiment(comment: string, tags?: Review['tags']): { sentiment: Sentiment; score: number } {
  const { pos, neg } = countLexiconHits(comment);
  const nudge = (pos - neg) / (pos + neg + 1); // -1..1 (Laplace-smoothed)

  if (tags?.sentiment) {
    const base = tags.sentiment === Sentiment.Positive ? SENTIMENT_ANCHOR : tags.sentiment === Sentiment.Negative ? -SENTIMENT_ANCHOR : 0;
    const score = clamp(base + nudge * SENTIMENT_NUDGE, -1, 1);
    return { sentiment: tags.sentiment, score };
  }

  const score = nudge;
  const sentiment = score > SENTIMENT_POS_CUT ? Sentiment.Positive : score < SENTIMENT_NEG_CUT ? Sentiment.Negative : Sentiment.Neutral;
  return { sentiment, score };
}

export function aggregateSentiment(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((a, r) => a + scoreSentiment(r.comment, r.tags).score, 0) / reviews.length;
}
