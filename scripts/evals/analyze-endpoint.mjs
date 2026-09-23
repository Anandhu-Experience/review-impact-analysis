import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { loadEnv } from 'vite';
import { loadEvalModules } from './loadModules.mjs';

/**
 * Eval for /api/analyze — the one place in RIA where a model actually reasons.
 *
 * Reference dataset: one case per demo scenario (src/data/scenarios.ts), built by running the
 * exact same pure services the app runs (getVisibleReviews → analyzeReview) so every request
 * sent to the model is one the app could really produce, not a hand-written fixture.
 *
 * Checks: cheap code-based checks first (schema shape, banned platitudes, cites-a-number),
 * then one LLM-judge call per case rubric-scored against the rules the endpoint's own system
 * prompt already states — go beyond classification, don't invent evidence, remedy specific
 * enough to start Monday, confidence honest about how thin the evidence is.
 *
 * Usage:
 *   node scripts/evals/analyze-endpoint.mjs            # run the full eval
 *   node scripts/evals/analyze-endpoint.mjs --dry-run   # build + print the dataset, no model calls
 */

const JUDGE_MODEL = 'claude-sonnet-5';
const REPORT_DIR = 'scripts/evals/reports';
const BANNED_REMEDY_PHRASES = [
  'improve service',
  'better service',
  'improve quality',
  'improve the quality',
  'be more attentive',
  'try harder',
  'do better',
  'work on it',
  'pay more attention',
];

function loadApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return true;
  const env = loadEnv('development', process.cwd(), '');
  if (env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
    return true;
  }
  return false;
}

/** One request per demo scenario, built from the same pure services the app calls. */
function buildCases({ seed, analyzeReview, getVisibleReviews, RequestSchema }) {
  return seed.scenarios.map((scenario) => {
    const reviewId = scenario.baselineReviewIds[0];
    const restaurant = seed.restaurants.find((r) => r.id === scenario.restaurantId);
    const visible = getVisibleReviews(scenario.restaurantId, [], seed);
    const analysis = analyzeReview(reviewId, seed, visible);
    if (!analysis) throw new Error(`No analysis for ${reviewId} (scenario ${scenario.id})`);

    const problem =
      analysis.problems.find((p) => p.category === analysis.rootCause.category) ?? analysis.problems[0];
    const itemName =
      seed.menuCatalog.find((c) => c.id === analysis.review.catalogItemId)?.name ?? analysis.review.foodCategory;

    const input = {
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      review: {
        comment: analysis.review.comment,
        rating: analysis.review.rating,
        itemName,
        price: analysis.review.price,
        date: analysis.review.date,
      },
      problem: {
        category: problem.category,
        severity: problem.severity,
        frequency: problem.frequency,
        avgRatingWhenMentioned: problem.avgRatingWhenMentioned,
      },
      peer: analysis.peer
        ? {
            itemName: analysis.peer.itemName,
            myPrice: analysis.peer.myPrice,
            peerAvgPrice: analysis.peer.peerAvgPrice,
            priceDeltaPct: analysis.peer.priceDeltaPct,
            myAvgRating: analysis.peer.myAvgRating,
            peerAvgRating: analysis.peer.peerAvgRating,
            ratingGap: analysis.peer.ratingGap,
            rank: analysis.peer.rank,
            peerCount: analysis.peer.peerCount,
          }
        : null,
      positiveThemes: analysis.positive?.positiveThemes ?? [],
      negativeThemes: analysis.positive?.negativeThemes ?? [],
    };

    RequestSchema.parse(input); // fails loudly if the dataset ever drifts from the endpoint's contract

    return { id: `${scenario.id}:${reviewId}`, label: `${restaurant.name} · ${problem.category}`, input };
  });
}

/** Cheap, deterministic checks — the signal that doesn't need a judge. */
function runCodeChecks(analysis) {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass, detail });

  push('confidence in range', analysis.confidence >= 0 && analysis.confidence <= 1, `confidence=${analysis.confidence}`);
  push('evidence count 1-4', analysis.evidence.length >= 1 && analysis.evidence.length <= 4, `count=${analysis.evidence.length}`);
  push('remedy steps 2-4', analysis.remedy.steps.length >= 2 && analysis.remedy.steps.length <= 4, `count=${analysis.remedy.steps.length}`);

  const remedyTitle = analysis.remedy.title.toLowerCase();
  const bannedHit = BANNED_REMEDY_PHRASES.find((p) => remedyTitle.includes(p));
  push('remedy not a platitude', !bannedHit, bannedHit ? `contains "${bannedHit}"` : 'no banned phrase');

  const evidenceText = analysis.evidence.map((e) => e.detail).join(' ');
  push('evidence cites a figure', /\d/.test(evidenceText), /\d/.test(evidenceText) ? 'has a digit' : 'no digit found');

  return checks;
}

const JudgeSchema = z.object({
  beyondClassification: z.object({ pass: z.boolean(), reason: z.string() }),
  grounded: z.object({ pass: z.boolean(), reason: z.string() }),
  remedySpecific: z.object({ pass: z.boolean(), reason: z.string() }),
  confidenceCalibrated: z.object({ pass: z.boolean(), reason: z.string() }),
});

const JUDGE_SYSTEM = `You are grading the output of an AI root-cause-analysis feature in a restaurant
review-intelligence product, against the rules its own system prompt was given. Be strict: a
plausible-sounding answer that breaks a rule still fails that rule.

Rules to check:
1. beyondClassification — the statement must name a causal MECHANISM inferred from the
   evidence, not just restate the problem category (e.g. "Service is slow" restates; "peak-hour
   orders queue because prep and expo share one line" explains).
2. grounded — every number, competitor detail, or quote in the statement/evidence must trace
   back to INPUT. Flag anything invented — a stat, a comparison, or review text not present in
   INPUT — even if it sounds plausible.
3. remedySpecific — the remedy must be concrete enough to start this week. Generic advice
   ("improve service", "be more attentive", "work harder") fails regardless of how it's phrased.
4. confidenceCalibrated — confidence should track evidence strength in INPUT: no peer benchmark,
   few themes, or a low review frequency should pull confidence down; strong peer gap and rich
   theme contrast can support higher confidence. Flag both overconfidence on thin evidence and
   needless hedging on strong evidence.`;

async function runJudge(client, input, analysis) {
  const prompt = `INPUT (what the model under test was given):
${JSON.stringify(input, null, 2)}

OUTPUT (what the model under test produced):
${JSON.stringify(analysis, null, 2)}

Grade OUTPUT against the four rules. Keep each reason to one sentence.`;

  const response = await client.messages.parse({
    model: JUDGE_MODEL,
    max_tokens: 4000,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: zodOutputFormat(JudgeSchema) },
  });

  if (!response.parsed_output) throw new Error('Judge returned no parseable verdict');
  return response.parsed_output;
}

function printCase(result) {
  const { label, codeChecks, judge, error } = result;
  console.log(`\n${label}  [${result.id}]`);
  if (error) {
    console.log(`  ✗ model call failed: ${error}`);
    return;
  }
  for (const c of codeChecks) console.log(`  ${c.pass ? '✓' : '✗'} ${c.name} — ${c.detail}`);
  if (judge) {
    for (const [key, v] of Object.entries(judge)) {
      console.log(`  ${v.pass ? '✓' : '✗'} [judge] ${key} — ${v.reason}`);
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const modules = await loadEvalModules();
  const cases = buildCases(modules);

  if (dryRun) {
    console.log(`Built ${cases.length} case(s) (dry run — no model calls):\n`);
    for (const c of cases) console.log(`- ${c.id}  ${c.label}\n  ${JSON.stringify(c.input)}\n`);
    return;
  }

  if (!loadApiKey()) {
    console.error(
      'No ANTHROPIC_API_KEY (checked process.env and .env). This eval calls the real model — ' +
        'set it the same way you would for `vercel dev` (see .env.example) and re-run.',
    );
    process.exitCode = 1;
    return;
  }

  const client = new Anthropic();
  const results = [];

  for (const c of cases) {
    try {
      const outcome = await modules.runAnalysis(c.input);
      if (outcome.status !== 'ok') {
        results.push({ ...c, error: `endpoint returned status "${outcome.status}"` });
        continue;
      }
      const codeChecks = runCodeChecks(outcome.analysis);
      const judge = await runJudge(client, c.input, outcome.analysis);
      results.push({ ...c, model: outcome.model, analysis: outcome.analysis, codeChecks, judge });
    } catch (e) {
      results.push({ ...c, error: e instanceof Error ? e.message : String(e) });
    }
  }

  for (const r of results) printCase(r);

  const flatCodeChecks = results.flatMap((r) => r.codeChecks ?? []);
  const flatJudgeChecks = results.flatMap((r) => (r.judge ? Object.values(r.judge) : []));
  const codePassRate = flatCodeChecks.length ? flatCodeChecks.filter((c) => c.pass).length / flatCodeChecks.length : 0;
  const judgePassRate = flatJudgeChecks.length ? flatJudgeChecks.filter((c) => c.pass).length / flatJudgeChecks.length : 0;
  const errored = results.filter((r) => r.error).length;

  console.log('\n— Summary —');
  console.log(`cases: ${results.length}  errored: ${errored}`);
  console.log(`code-based checks: ${(codePassRate * 100).toFixed(0)}% pass (${flatCodeChecks.length} checks)`);
  console.log(`judge checks: ${(judgePassRate * 100).toFixed(0)}% pass (${flatJudgeChecks.length} checks)`);

  await mkdir(REPORT_DIR, { recursive: true });
  const reportPath = join(REPORT_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nFull report: ${reportPath}`);

  // Hard-fail CI only on the deterministic checks and outright errors — a judge disagreement
  // is a strong signal worth reading, not grounds to block a deploy on its own.
  const hardFail = errored > 0 || flatCodeChecks.some((c) => !c.pass);
  process.exitCode = hardFail ? 1 : 0;
}

await main();
