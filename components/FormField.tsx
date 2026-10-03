"use client";

import { cn } from "@/lib/utils";

type BaseFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

/** Shared label + control + message markup so every field behaves identically. */
function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  trailing,
  children,
}: BaseFieldProps & { trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? (
            <>
              {" "}
              <span className="text-danger">*</span>
            </>
          ) : null}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** Renders a textarea instead of an input. */
  multiline?: boolean;
  rows?: number;
  /** Shows a "used / limit" counter beside the label. */
  showCounter?: boolean;
  controlClassName?: string;
};

export function TextField({
  id,
  label,
  error,
  hint,
  required,
  value,
  onChange,
  placeholder,
  maxLength,
  multiline = false,
  rows = 4,
  showCounter = false,
  controlClassName,
}: TextFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const className = cn(
    "input",
    error && "border-danger focus:border-danger focus:ring-danger/25",
    multiline && "resize-y",
    controlClassName,
  );

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      trailing={
        showCounter && maxLength ? (
          <span className="text-xs tabular-nums text-muted">
            {value.length}/{maxLength}
          </span>
        ) : undefined
      }
    >
      {multiline ? (
        <textarea
          id={id}
          name={id}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={className}
        />
      ) : (
        <input
          id={id}
          name={id}
          type="text"
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={className}
        />
      )}
    </FieldShell>
  );
}

type SelectOption = string | { value: string; label: string };

type SelectFieldProps = BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
};

export function SelectField({
  id,
  label,
  error,
  hint,
  required,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn("input", error && "border-danger focus:border-danger focus:ring-danger/25")}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </FieldShell>
  );
}
