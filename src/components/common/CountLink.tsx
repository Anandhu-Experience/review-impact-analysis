import type { ReactNode } from 'react';

interface CountLinkProps {
  onClick: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * An inline number that answers "which reviews is this?" — every count in the app that stands
 * for a set of reviews renders through this, so the affordance is identical everywhere.
 */
export function CountLink({ onClick, title, children }: CountLinkProps) {
  return (
    <button type="button" className="ria-count-link" onClick={onClick} title={title ?? 'View these reviews'}>
      {children}
    </button>
  );
}
