"use client";

import { forwardRef } from "react";
import { FieldShell, controlClass, fieldDescribedBy } from "@/components/ui/FieldShell";
import { cn } from "@/lib/utils";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

/** Single-line text field: 40px tall, 12px horizontal padding, label above. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, required, className, ...props },
  ref,
) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        id={id}
        name={props.name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn(controlClass, "h-10", className)}
        {...props}
      />
    </FieldShell>
  );
});
