"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Wand2 } from "lucide-react";
import { SelectField, TextField } from "@/components/FormField";
import { RoleChips } from "@/components/RoleChips";
import { OUTPUT_TYPES, type GeneratorInput, type OutputType } from "@/lib/types";
import {
  FIELD_LIMITS,
  GOAL_MIN_LENGTH,
  isOutputType,
  validateGeneratorInput,
  type FieldErrors,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

/** Form-shaped values: the output type is empty until the user picks one. */
type FormValues = Omit<GeneratorInput, "outputType"> & { outputType: OutputType | "" };

const EMPTY_VALUES: FormValues = {
  goal: "",
  role: "",
  outputType: "",
  tone: "",
  audience: "",
  length: "",
  constraints: "",
};

type GeneratorFormProps = {
  isGenerating: boolean;
  onGenerate: (input: GeneratorInput) => void;
  /** Field errors returned by the API, shown until the user edits that field. */
  externalErrors?: FieldErrors;
};

export function GeneratorForm({ isGenerating, onGenerate, externalErrors }: GeneratorFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [clearedExternal, setClearedExternal] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  /** Local errors win; an external error disappears once the field is edited. */
  function errorFor(key: string): string | undefined {
    return errors[key] || (clearedExternal[key] ? undefined : externalErrors?.[key]) || undefined;
  }

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setClearedExternal((previous) => (previous[key] ? previous : { ...previous, [key]: true }));
  }

  const hasContent = Object.values(values).some((value) => value.trim() !== "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isGenerating) return;

    const payload: FormValues = {
      goal: values.goal.trim(),
      role: values.role.trim(),
      outputType: values.outputType,
      tone: values.tone?.trim(),
      audience: values.audience?.trim(),
      length: values.length?.trim(),
      constraints: values.constraints?.trim(),
    };

    const nextErrors = validateGeneratorInput(payload);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      // Move focus to the first problem so keyboard users are not stranded.
      document.getElementById(Object.keys(nextErrors)[0] ?? "")?.focus();
      return;
    }

    // validateGeneratorInput has already confirmed this, so the guard is a type check.
    if (!isOutputType(payload.outputType)) return;

    setErrors({});
    onGenerate({ ...payload, outputType: payload.outputType });
  }

  function reset() {
    setValues(EMPTY_VALUES);
    setErrors({});
    // `clearedExternal` is intentionally kept: emptying the form should not
    // bring back server-side field errors the user already dismissed.
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5 sm:p-6">
      <div className="space-y-5">
        <TextField
          id="goal"
          label="Goal"
          required
          multiline
          rows={4}
          maxLength={FIELD_LIMITS.goal}
          showCounter
          value={values.goal}
          onChange={(value) => update("goal", value)}
          error={errorFor("goal")}
          hint={`Minimum ${GOAL_MIN_LENGTH} characters. Specific goals produce better prompts.`}
          placeholder="What should the AI produce? e.g. Write a landing page that convinces small-business owners to try our invoicing tool."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <TextField
              id="role"
              label="Role"
              required
              maxLength={FIELD_LIMITS.role}
              value={values.role}
              onChange={(value) => update("role", value)}
              error={errorFor("role")}
              placeholder="e.g. Marketing Strategist"
            />
            <div className="mt-2.5">
              <RoleChips value={values.role} onChange={(role) => update("role", role)} />
            </div>
          </div>

          <SelectField
            id="outputType"
            label="Output type"
            required
            options={OUTPUT_TYPES}
            placeholder="Select an output type…"
            value={values.outputType}
            onChange={(value) => update("outputType", value as FormValues["outputType"])}
            error={errorFor("outputType")}
            hint="Shapes the prompt's structure and quality rules."
          />
        </div>

        <div className="rounded-xl border border-line bg-subtle/60 p-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((open) => !open)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-fields"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-sm font-medium"
          >
            <span>Advanced options</span>
            <span className="flex items-center gap-2 text-xs font-normal text-muted">
              Tone, audience, length, constraints
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
                aria-hidden="true"
              />
            </span>
          </button>

          {showAdvanced ? (
            <div id="advanced-fields" className="mt-3 grid animate-fade-up gap-4 sm:grid-cols-2">
              <TextField
                id="tone"
                label="Tone"
                maxLength={FIELD_LIMITS.tone}
                value={values.tone ?? ""}
                onChange={(value) => update("tone", value)}
                error={errorFor("tone")}
                placeholder="e.g. Direct, warm, no jargon"
              />
              <TextField
                id="audience"
                label="Target audience"
                maxLength={FIELD_LIMITS.audience}
                value={values.audience ?? ""}
                onChange={(value) => update("audience", value)}
                error={errorFor("audience")}
                placeholder="e.g. First-time founders"
              />
              <TextField
                id="length"
                label="Desired length"
                maxLength={FIELD_LIMITS.length}
                value={values.length ?? ""}
                onChange={(value) => update("length", value)}
                error={errorFor("length")}
                placeholder="e.g. 800-1000 words"
              />
              <TextField
                id="constraints"
                label="Extra constraints"
                maxLength={FIELD_LIMITS.constraints}
                value={values.constraints ?? ""}
                onChange={(value) => update("constraints", value)}
                error={errorFor("constraints")}
                placeholder="e.g. No emoji, cite sources, British spelling"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isGenerating} aria-busy={isGenerating} className="btn-primary">
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Wand2 className="h-4 w-4" aria-hidden="true" />
          )}
          {isGenerating ? "Generating…" : "Generate master prompt"}
        </button>

        {hasContent && !isGenerating ? (
          <button type="button" onClick={reset} className="btn-ghost">
            Clear form
          </button>
        ) : null}

        <p className="text-xs text-muted">Usually takes 5-15 seconds.</p>
      </div>
    </form>
  );
}
