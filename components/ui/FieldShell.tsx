"use client";

/**
 * Label above, control, then helper or error text below — the only form-field
 * layout in the app. Owns the aria wiring so every control behaves identically:
 * `aria-describedby` points at whichever message is showing.
 *
 * `labelHidden` keeps the label for screen readers while omitting the visible
 * row, which is what toolbar controls need.
 */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required = false,
  labelHidden = false,
  trailing,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  labelHidden?: boolean;
  /** Optional right-aligned content in the label row, e.g. a character counter. */
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const labelText = (
    <>
      {label}
      {required ? (
        <>
          {" "}
          <span aria-hidden="true" className="text-fg-muted">
            *
          </span>
        </>
      ) : null}
    </>
  );

  return (
    <div className="w-full">
      {labelHidden ? (
        <label htmlFor={id} className="sr-only">
          {labelText}
        </label>
      ) : (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="text-field font-medium text-fg">
            {labelText}
          </label>
          {trailing}
        </div>
      )}

      {children}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-label text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-label text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Shared control styling so input, textarea and select match exactly.
 * Width is applied by each component, not here, so a control can be full width
 * in a form and auto width in a toolbar without fighting itself.
 */
export const controlClass =
  "rounded-control border border-border bg-bg px-3 text-body text-fg " +
  "transition-colors duration-150 placeholder:text-fg-placeholder hover:border-border-strong " +
  "focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-error";

export function fieldDescribedBy(id: string, hint?: string, error?: string): string | undefined {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}
