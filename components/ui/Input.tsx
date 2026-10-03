"use client";

import { forwardRef } from "react";
import { FieldShell, controlClass, fieldDescribedBy } from "@/components/ui/FieldShell";
import { cn } from "@/lib/utils";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Keeps the label for screen readers without showing it (toolbars). */
  labelHidden?: boolean;
  /** `auto` sizes to content, for filters and toolbars. */
  width?: "full" | "auto";
  /** Optional leading glyph, rendered inside the field. */
  icon?: React.ReactNode;
};

/** Single-line text field: 40px tall, 12px horizontal padding, label above. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    required,
    labelHidden,
    width = "full",
    icon,
    className,
    ...props
  },
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
      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted [&_svg]:size-4"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          name={props.name ?? id}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(id, hint, error)}
          className={cn(
            controlClass,
            "h-10",
            width === "full" ? "w-full" : "w-auto",
            Boolean(icon) && "pl-8",
            className,
          )}
          {...props}
        />
      </div>
    </FieldShell>
  );
});
