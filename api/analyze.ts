import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

/**
 * The one place in RIA where a model actually reasons.
 *
 * Everything else in this app is deterministic by design — classification is authored
 * ground truth, severity is a weighted formula, the verdict falls out of thresholds. That
 * determinism is what makes the demo reproducible, and it is worth keeping. What it cannot
 * do is the judgment step: reading one bad review against its peer context and saying *why*
 * this is happening and what specifically to change. `deriveRootCause` fakes that with a
 * template. This endpoint does it for real.
 *
 * It runs server-side because the API key must never reach the browser bundle. The client
 * falls back to the deterministic pipeline whenever this is unavailable, so a missing key,
 * a cold start or a rate limit degrades the analysis rather than breaking the page.
 */

const RootCauseSchema = z.object({
  statement: z
    .string()
    .describe(
      'The root cause in 1–2 sentences. Must go beyond restating the category: name the ' +
        'mechanism you infer from the evidence, not the symptom the review reports.',
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How well the evidence supports the statement. Be honest — thin evidence means a low number.'),
  evidence: z
    .array(
      z.object({
        label: z.string().describe('Short tag, e.g. "Peer pricing" or "Complaint volume".'),
        detail: z.string().describe('One sentence citing the specific figure or quote it rests on.'),
      }),
    )
    .min(1)
    .max(4),
  remedy: z.object({
    title: z.string().describe('A specific action, not a platitude. Never "improve service".'),
    steps: z.array(z.string()).min(2).max(4).describe('Concrete steps the owner can start this week.'),
    expectedImpact: z.string().describe('What should move, and roughly by how much.'),
  }),
});

const RequestSchema = z.object({
  restaurantName: z.string().max(120),
  cuisine: z.string().max(60),
  review: z.object({
    comment: z.string().max(1000),
    rating: z.number().min(1).max(5),
    itemName: z.string().max(120),
    price: z.number(),
    date: z.string().max(20),
  }),
  problem: z.object({
    category: z.string().max(40),
    severity: z.number(),
    frequency: z.number(),
    avgRatingWhenMentioned: z.number(),
  }),
  peer: z
    .object({
      itemName: z.string().max(120),
      myPrice: z.number(),
      peerAvgPrice: z.number(),
      priceDeltaPct: z.number(),
      myAvgRating: z.number(),
      peerAvgRating: z.number(),
      ratingGap: z.number(),
      rank: z.number(),
      peerCount: z.number(),
    })
    .nullable(),
  positiveThemes: z.array(z.string().max(60)).max(12),
  negativeThemes: z.array(z.string().max(60)).max(12),
});

const SYSTEM = `You are the analysis engine inside Review Impact Analysis, a tool used by
independent restaurant owners.

Your job is the step that classification cannot do. The category of the complaint is already
known; the owner can read the review themselves. What they cannot see is the mechanism: why
this keeps happening, given how their item is priced and rated against the same dish at
comparable restaurants, and what their negative reviews cite that the peers' positive ones do
not.

Rules:
- Reason from the evidence you are given. Do not invent figures, competitors, or review text.
- If the evidence is thin, say so in the statement and give it a low confidence. A hedged,
  honest answer is more useful than a confident guess.
- The remedy must be specific enough to start on Monday. "Improve service" is a failure.
- Write for a busy owner: plain language, no consultant register, no filler.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // A deliberate 503 rather than a 500: the client reads this as "fall back quietly",
    // which is exactly right when the deployment simply has no key configured.
    //
    // The hint lists only env var NAMES matching /anthropic/i — never values — because the
    // usual cause of a 503 after someone has "added the key" is a name that is close but not
    // exact, or a variable scoped to the wrong environment, and neither is visible from
    // outside otherwise.
    const seen = Object.keys(process.env).filter((k) => /anthropic/i.test(k));
    return res.status(503).json({
      error: 'AI analysis is not configured on this deployment.',
      hint:
        seen.length > 0
          ? `Anthropic-ish variables this deployment can see: ${seen.join(', ')} — but ANTHROPIC_API_KEY is empty or absent.`
          : 'This deployment sees no environment variable whose name contains "anthropic".',
    });
  }

  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Malformed analysis request', detail: parsed.error.message });
  }
  const input = parsed.data;

  const peerLine = input.peer
    ? `Same dish at ${input.peer.peerCount} comparable restaurant(s): they average ${input.peer.peerAvgRating}★ and $${input.peer.peerAvgPrice.toFixed(2)}; this restaurant averages ${input.peer.myAvgRating}★ at $${input.peer.myPrice.toFixed(2)} (${input.peer.priceDeltaPct > 0 ? '+' : ''}${input.peer.priceDeltaPct.toFixed(1)}% on price, ${input.peer.ratingGap.toFixed(1)}★ on rating), ranking ${input.peer.rank} of ${input.peer.peerCount + 1}.`
    : 'No comparable peer offerings exist for this item, so there is no peer benchmark.';

  const prompt = `Restaurant: ${input.restaurantName} (${input.cuisine})

The review:
"${input.review.comment}"
${input.review.rating}★ · ${input.review.itemName} · $${input.review.price.toFixed(2)} · ${input.review.date}

Detected problem: ${input.problem.category}, severity ${input.problem.severity}/100, cited in ${input.problem.frequency} negative reviews, which average ${input.problem.avgRatingWhenMentioned}★.

${peerLine}

What peers' happy customers praise on this dish: ${input.positiveThemes.join(', ') || '(nothing recorded)'}
What this restaurant's unhappy customers cite: ${input.negativeThemes.join(', ') || '(nothing recorded)'}

Give the root cause and one remedy.`;

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
      output_config: { format: zodOutputFormat(RootCauseSchema) },
    });

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'The model declined this request.' });
    }
    if (!response.parsed_output) {
      return res.status(502).json({ error: 'The model returned no parseable analysis.' });
    }

    return res.status(200).json({
      source: 'ai',
      model: response.model,
      analysis: response.parsed_output,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(503).json({ error: 'AI analysis is misconfigured (bad API key).' });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Rate limited — try again shortly.' });
    }
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Model API error ${error.status}` });
    }
    return res.status(500).json({ error: 'Unexpected failure generating the analysis.' });
  }
}
