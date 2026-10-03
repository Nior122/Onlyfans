"use client";

import { forwardRef } from "react";
import { FieldShell, controlClass, fieldDescribedBy } from "@/components/ui/FieldShell";
import { cn } from "@/lib/utils";

export type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

/** Multi-line field: 12px padding all round, minimum height 120px. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, required, className, rows = 5, ...props },
  ref,
) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={id}
        name={props.name ?? id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn(controlClass, "min-h-[120px] w-full resize-y py-3", className)}
        {...props}
      />
    </FieldShell>
  );
});
