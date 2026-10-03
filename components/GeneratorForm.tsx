"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Wand2 } from "lucide-react";
import { RoleChips } from "@/components/RoleChips";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
    <Card padding="md" className="sm:p-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Textarea
          id="goal"
          label="Goal"
          required
          rows={5}
          maxLength={FIELD_LIMITS.goal}
          value={values.goal}
          onChange={(event) => update("goal", event.target.value)}
          error={errorFor("goal")}
          hint={`At least ${GOAL_MIN_LENGTH} characters. Specific goals produce better prompts.`}
          placeholder="What should the AI produce? e.g. Write a landing page that convinces small-business owners to try our invoicing tool."
          className={cn(errorFor("goal") && "border-error")}
        />

        <Input
          id="role"
          label="Role"
          required
          maxLength={FIELD_LIMITS.role}
          value={values.role}
          onChange={(event) => update("role", event.target.value)}
          error={errorFor("role")}
          placeholder="e.g. Marketing Strategist"
          className={cn(errorFor("role") && "border-error")}
        />

        <RoleChips value={values.role} onChange={(role) => update("role", role)} />

        <Select
          id="outputType"
          label="Output type"
          required
          options={OUTPUT_TYPES}
          placeholder="Select an output type…"
          value={values.outputType}
          onChange={(event) =>
            update("outputType", event.target.value as FormValues["outputType"])
          }
          error={errorFor("outputType")}
          hint="Shapes the prompt's structure and quality rules."
          className={cn(errorFor("outputType") && "border-error")}
        />

        {/* Advanced — secondary options, collapsed until asked for. */}
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((open) => !open)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-fields"
            className="flex w-full items-center gap-2 rounded-control py-1 text-left text-body text-fg-secondary transition-colors duration-150 hover:text-fg"
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-150", showAdvanced && "rotate-180")}
              aria-hidden="true"
            />
            Advanced options
            <span className="text-label text-fg-muted">
              tone, audience, length, constraints
            </span>
          </button>

          <AnimatePresence initial={false}>
            {showAdvanced ? (
              <motion.div
                id="advanced-fields"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="grid gap-4 pt-4 sm:grid-cols-2"
              >
                <Input
                  id="tone"
                  label="Tone"
                  maxLength={FIELD_LIMITS.tone}
                  value={values.tone ?? ""}
                  onChange={(event) => update("tone", event.target.value)}
                  error={errorFor("tone")}
                  placeholder="Direct, warm, no jargon"
                />
                <Input
                  id="audience"
                  label="Target audience"
                  maxLength={FIELD_LIMITS.audience}
                  value={values.audience ?? ""}
                  onChange={(event) => update("audience", event.target.value)}
                  error={errorFor("audience")}
                  placeholder="First-time founders"
                />
                <Input
                  id="length"
                  label="Desired length"
                  maxLength={FIELD_LIMITS.length}
                  value={values.length ?? ""}
                  onChange={(event) => update("length", event.target.value)}
                  error={errorFor("length")}
                  placeholder="800-1000 words"
                />
                <Input
                  id="constraints"
                  label="Extra constraints"
                  maxLength={FIELD_LIMITS.constraints}
                  value={values.constraints ?? ""}
                  onChange={(event) => update("constraints", event.target.value)}
                  error={errorFor("constraints")}
                  placeholder="No emoji, cite sources"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isGenerating}
            aria-busy={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 aria-hidden="true" />
            )}
            {isGenerating ? "Generating…" : "Generate master prompt"}
          </Button>

          {hasContent && !isGenerating ? (
            <Button variant="ghost" onClick={reset} className="w-full sm:w-auto">
              Clear form
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
