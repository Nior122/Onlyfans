"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { FieldShell, controlClass, fieldDescribedBy } from "@/components/ui/FieldShell";
import { cn } from "@/lib/utils";

export type SelectOption = string | { value: string; label: string };

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
  id: string;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
  /** Keeps the label for screen readers without showing it (toolbars). */
  labelHidden?: boolean;
  /** `auto` sizes to content, for filters and toolbars. */
  width?: "full" | "auto";
};

/**
 * Native select (keeps the platform picker and keyboard behaviour) with the
 * default arrow hidden so the field matches the input styling exactly.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    options,
    placeholder,
    hint,
    error,
    required,
    labelHidden,
    width = "full",
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
      <div className={cn("relative", width === "auto" && "inline-block")}>
        <select
          ref={ref}
          id={id}
          name={props.name ?? id}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(id, hint, error)}
          className={cn(
            controlClass,
            "h-10 appearance-none pr-9",
            width === "full" ? "w-full" : "w-auto",
            className,
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => {
            const item = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
});
