// Shape written by scripts/evals/analyze-endpoint.mjs into src/data/evalHistory.json.
// Kept separate from the full per-run report (scripts/evals/reports/, gitignored): this is
// the compact, committed history the app's /evals page reads — findings only, no raw
// model input/output, so the file stays small across many runs.

export interface EvalCheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

export interface EvalJudgeDimension {
  pass: boolean;
  reason: string;
}

export interface EvalCaseResult {
  id: string;
  label: string;
  error?: string;
  codeChecks?: EvalCheckResult[];
  judge?: Record<string, EvalJudgeDimension>;
}

export interface EvalRun {
  timestamp: string; // ISO
  model: string;
  judgeModel: string;
  cases: EvalCaseResult[];
  summary: {
    cases: number;
    errored: number;
    codePassRate: number;
    judgePassRate: number;
  };
}
