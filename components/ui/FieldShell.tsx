"use client";

/**
 * Label above, control, then helper or error text below — the only form-field
 * layout in the app. Owns the aria wiring so every control behaves identically:
 * `aria-describedby` points at whichever message is showing.
 */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required = false,
  trailing,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Optional right-aligned content in the label row, e.g. a character counter. */
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-label text-fg-secondary">
          {label}
          {required ? (
            <>
              {" "}
              <span aria-hidden="true" className="text-error">
                *
              </span>
            </>
          ) : null}
        </label>
        {trailing}
      </div>

      {children}

      {error ? (
        <p id={`${id}-error`} className="mt-2 text-label text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-label text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Shared control styling so input, textarea and select match exactly. */
export const controlClass =
  "w-full rounded-control border border-border bg-bg px-3 text-body text-fg " +
  "transition-colors duration-150 placeholder:text-fg-placeholder hover:border-border-strong " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-error";

export function fieldDescribedBy(id: string, hint?: string, error?: string): string | undefined {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}
