"use client";

import { forwardRef } from "react";
import { FieldShell, controlClass, fieldDescribedBy } from "@/components/ui/FieldShell";
import { cn } from "@/lib/utils";

export type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Keeps the label for screen readers without showing it (editor panels). */
  labelHidden?: boolean;
};

/** Multi-line field: 12px padding all round, minimum height 112px. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, required, labelHidden, className, rows = 5, ...props },
  ref,
) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      labelHidden={labelHidden}
    >
      <textarea
        ref={ref}
        id={id}
        name={props.name ?? id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn(controlClass, "min-h-28 w-full resize-y py-3", className)}
        {...props}
      />
    </FieldShell>
  );
});
