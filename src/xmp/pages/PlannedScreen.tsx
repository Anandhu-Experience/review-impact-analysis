import { Construction } from 'lucide-react';

/**
 * An honest placeholder. It names the v2 source it must reach parity with, so an
 * un-built screen reads as a gap rather than looking finished or looking missing.
 */
export function PlannedScreen({
  title,
  v2Source,
  note,
}: {
  title: string;
  v2Source: string;
  note: string;
}) {
  return (
    <div className="p-10">
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#fedf89] bg-[#fffaeb] px-3 py-1 text-xs font-semibold tracking-wide text-[#b54708]">
          <Construction className="h-3.5 w-3.5" aria-hidden="true" />
          NOT YET AT PARITY
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{note}</p>
        <dl className="border-t border-border pt-4 text-[13px]">
          <dt className="mb-1 font-medium text-muted-foreground">
            Must reach parity with
          </dt>
          <dd className="font-mono text-xs">{v2Source}</dd>
        </dl>
      </div>
    </div>
  );
}
