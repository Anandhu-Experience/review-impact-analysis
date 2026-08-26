import { ActionStatus, Sentiment, Priority } from '../types';

// AntD Tag/Badge color tokens for the 6 statuses (single mapping).
export const statusTagColor: Record<ActionStatus, string> = {
  [ActionStatus.NotStarted]: 'default',
  [ActionStatus.InProgress]: 'processing',
  [ActionStatus.Monitoring]: 'warning',
  [ActionStatus.Completed]: 'cyan',
  [ActionStatus.ImprovementConfirmed]: 'success',
  [ActionStatus.NoSignificantChange]: 'error',
};

export const sentimentTagColor: Record<Sentiment, string> = {
  [Sentiment.Positive]: 'success',
  [Sentiment.Neutral]: 'default',
  [Sentiment.Negative]: 'error',
};

export const priorityTagColor: Record<Priority, string> = {
  [Priority.High]: 'red',
  [Priority.Medium]: 'orange',
  [Priority.Low]: 'blue',
};

export const RATING_LABEL: Record<number, string> = { 1: 'Low', 2: 'Moderate', 3: 'Average', 4: 'Good', 5: 'Excellent' };

export const ratingBarColor = (r: number): string =>
  ({ 1: '#d32f2f', 2: '#f57c00', 3: '#fbc02d', 4: '#7cb342', 5: '#2e7d32' } as Record<number, string>)[r] ?? '#9e9e9e';

export const fmtRating = (n: number): string => `${n.toFixed(1)}★`;
export const fmtSigned = (n: number, digits = 0): string => `${n > 0 ? '+' : ''}${n.toFixed(digits)}`;
