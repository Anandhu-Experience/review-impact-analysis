import {
  ACCOUNT_STATUS_LABEL,
  ACCOUNT_STATUS_TONE,
  type AccountStatusCode,
  type StatusTone,
} from '../lib/types';

/**
 * v2 leaks the raw numeric code into the UI — a row can literally read "3". Here the
 * code stays in the data and the human reads a label. Parity of capability, not layout.
 */
const TONE: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
  active: { bg: '#ecfdf3', fg: '#067647', dot: '#17b26a' },
  onboarding: { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
  inactive: { bg: '#f2f4f7', fg: '#475467', dot: '#98a2b3' },
  suspended: { bg: '#fef3f2', fg: '#b42318', dot: '#f04438' },
  pending: { bg: '#fffaeb', fg: '#b54708', dot: '#f79009' },
};

export function StatusPill({
  status,
  title,
}: {
  status: AccountStatusCode;
  title?: string;
}) {
  const tone = TONE[ACCOUNT_STATUS_TONE[status]];
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
      {ACCOUNT_STATUS_LABEL[status]}
    </span>
  );
}
