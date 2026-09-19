import { AlertCircle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

/**
 * A screen is not "Done" until these three exist. v2 is inconsistent about them, so
 * they are first-class here rather than an afterthought per screen.
 */

export function LoadingRows({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="divide-y divide-border">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex h-[62px] items-center gap-6 px-1">
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="h-3 animate-pulse rounded bg-muted"
              style={{ width: c === 0 ? 220 : 70 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{hint}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
    >
      <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
      <p className="text-sm font-semibold">Something went wrong</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
