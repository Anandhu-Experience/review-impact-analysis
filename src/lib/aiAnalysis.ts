import type { DetectedProblem, PeerComparisonResult, PositiveReviewComparison, Review } from '../types';

/**
 * Client side of the one AI call in the app.
 *
 * The endpoint holds the API key, so the browser never sees it. Everything here is written
 * to degrade rather than fail: no deployment key, a cold start, a rate limit or a timeout all
 * end in the caller keeping the deterministic analysis it already computed.
 */

export interface AiRootCause {
  statement: string;
  confidence: number;
  evidence: { label: string; detail: string }[];
  remedy: { title: string; steps: string[]; expectedImpact: string };
}

export interface AiAnalysisResult {
  source: 'ai';
  model: string;
  analysis: AiRootCause;
}

export interface AiAnalysisRequest {
  restaurantName: string;
  cuisine: string;
  review: Review;
  itemName: string;
  problem: DetectedProblem;
  peer: PeerComparisonResult | null;
  positive: PositiveReviewComparison | null;
}

/** Same review, same answer, one call — analysis pages get revisited constantly in a demo. */
const cache = new Map<string, AiAnalysisResult>();

const TIMEOUT_MS = 60_000;

export type AiAnalysisOutcome =
  | { status: 'ok'; result: AiAnalysisResult }
  | { status: 'unavailable'; reason: string };

export async function requestAiAnalysis(req: AiAnalysisRequest): Promise<AiAnalysisOutcome> {
  const cached = cache.get(req.review.id);
  if (cached) return { status: 'ok', result: cached };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        restaurantName: req.restaurantName,
        cuisine: req.cuisine,
        review: {
          comment: req.review.comment,
          rating: req.review.rating,
          itemName: req.itemName,
          price: req.review.price,
          date: req.review.date,
        },
        problem: {
          category: req.problem.category,
          severity: req.problem.severity,
          frequency: req.problem.frequency,
          avgRatingWhenMentioned: req.problem.avgRatingWhenMentioned,
        },
        peer: req.peer
          ? {
              itemName: req.peer.itemName,
              myPrice: req.peer.myPrice,
              peerAvgPrice: req.peer.peerAvgPrice,
              priceDeltaPct: req.peer.priceDeltaPct,
              myAvgRating: req.peer.myAvgRating,
              peerAvgRating: req.peer.peerAvgRating,
              ratingGap: req.peer.ratingGap,
              rank: req.peer.rank,
              peerCount: req.peer.peerCount,
            }
          : null,
        positiveThemes: req.positive?.positiveThemes ?? [],
        negativeThemes: req.positive?.negativeThemes ?? [],
      }),
    });

    if (!response.ok) {
      // 404 is the local `vite dev` case — there is no serverless runtime there at all.
      const reason =
        response.status === 404
          ? 'No AI endpoint on this server (run `vercel dev` or deploy to use it).'
          : ((await response.json().catch(() => null))?.error ?? `AI endpoint returned ${response.status}`);
      return { status: 'unavailable', reason };
    }

    const result = (await response.json()) as AiAnalysisResult;
    cache.set(req.review.id, result);
    return { status: 'ok', result };
  } catch (e) {
    const reason =
      e instanceof DOMException && e.name === 'AbortError'
        ? 'The analysis took too long and was cancelled.'
        : 'Could not reach the AI endpoint.';
    return { status: 'unavailable', reason };
  } finally {
    clearTimeout(timer);
  }
}
