// Impact verdict thresholds + tuning constants. Single source; QA and demo tuning stay here.
// Scenario 5 clears these; Scenario 6 fails them; the Monitoring edge is afterCount < MIN_AFTER_REVIEWS.
export const MIN_AVG_RATING_DELTA = 0.6;
export const MIN_COMPLAINT_DROP = 3;
export const MIN_AFTER_REVIEWS = 5;
export const MIN_SENTIMENT_DELTA = 0.3;

// Severity formula weights (sum to 1), 0–100 scale.
export const SEVERITY_WEIGHTS = { freq: 0.45, neg: 0.3, drag: 0.25 };

// Sentiment scoring anchors/cuts.
export const SENTIMENT_ANCHOR = 0.8; // |score| for an authored Positive/Negative tag
export const SENTIMENT_NUDGE = 0.2; // how much the lexicon may nudge an anchored score
export const SENTIMENT_POS_CUT = 0.2;
export const SENTIMENT_NEG_CUT = -0.2;
