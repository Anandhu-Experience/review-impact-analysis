import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '../lib/utils';

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[12px] font-medium text-muted-foreground"
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {error ? (
        <p className="mt-1 text-[11.5px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11.5px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const control =
  'w-full rounded-md border bg-card px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground';

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  type = 'text',
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(control, 'h-9', invalid ? 'border-destructive' : 'border-input')}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  invalid?: boolean;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(control, 'py-2', invalid ? 'border-destructive' : 'border-input')}
    />
  );
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(control, 'h-9 border-input')}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Multi-select rendered as toggle chips — v2 uses a ServicesDropdown for this. */
export function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
              on
                ? 'border-accent-border bg-accent-soft text-accent'
                : 'border-input bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {on ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
            {o}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Read-only facts. v2's Edit Account renders four permanently-disabled inputs; showing
 * immutable attributes as facts rather than dead fields is the redesign.
 */
export function FactGrid({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {facts.map((f) => (
        <div key={f.label}>
          <div className="text-[11px] text-muted-foreground">{f.label}</div>
          <div className="text-[13px] font-medium">{f.value}</div>
        </div>
      ))}
    </div>
  );
}
