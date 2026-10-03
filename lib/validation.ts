import type { GeneratorInput, OutputType } from "@/lib/types";
import { OUTPUT_TYPES } from "@/lib/types";

/** Hard caps per field, enforced in the form and again on the server. */
export const FIELD_LIMITS = {
  goal: 2000,
  role: 120,
  outputType: 60,
  tone: 120,
  audience: 300,
  length: 120,
  constraints: 1000,
} as const;

export const GOAL_MIN_LENGTH = 10;

const ROLE_MIN_LENGTH = 2;

export type FieldErrors = Record<string, string>;

/**
 * Form-shaped input: identical to GeneratorInput except the output type may
 * still be empty while the user is choosing one.
 */
type ValidatableInput = Omit<GeneratorInput, "outputType"> & { outputType: string };

/** Type guard so callers can narrow a free-form string to OutputType. */
export function isOutputType(value: string): value is OutputType {
  return (OUTPUT_TYPES as readonly string[]).includes(value);
}

/** Drops control characters (keeping newlines and tabs) and tidies whitespace. */
function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * The single source of truth for field rules. Used by the form for immediate
 * feedback and by the API route for untrusted input, so both always agree.
 */
export function validateGeneratorInput(input: ValidatableInput): FieldErrors {
  const errors: FieldErrors = {};

  const goal = input.goal.trim();
  if (goal.length < GOAL_MIN_LENGTH) {
    errors.goal = `Describe your goal in at least ${GOAL_MIN_LENGTH} characters.`;
  } else if (goal.length > FIELD_LIMITS.goal) {
    errors.goal = `Keep the goal under ${FIELD_LIMITS.goal} characters.`;
  }

  const role = input.role.trim();
  if (role.length < ROLE_MIN_LENGTH) {
    errors.role = "Add a role, or pick one of the suggestions.";
  } else if (role.length > FIELD_LIMITS.role) {
    errors.role = `Keep the role under ${FIELD_LIMITS.role} characters.`;
  }

  if (!isOutputType(input.outputType)) {
    errors.outputType = "Choose an output type from the list.";
  }

  for (const key of ["tone", "audience", "length", "constraints"] as const) {
    const value = input[key];
    if (value && value.length > FIELD_LIMITS[key]) {
      errors[key] = `Keep this under ${FIELD_LIMITS[key]} characters.`;
    }
  }

  return errors;
}

type ValidationResult =
  | { ok: true; input: GeneratorInput }
  | { ok: false; message: string; fields: FieldErrors };

/** Reads one field as sanitized text, recording a type error when it is not a string. */
function readField(
  source: Record<string, unknown>,
  key: keyof typeof FIELD_LIMITS,
  fields: FieldErrors,
): string {
  const raw = source[key];
  if (raw === undefined || raw === null) return "";
  if (typeof raw !== "string") {
    fields[key] = "Must be text.";
    return "";
  }
  return sanitizeText(raw);
}

/**
 * Validates an untrusted request body and returns a typed GeneratorInput.
 * Never throws: callers branch on `ok`.
 */
export function parseGeneratorInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object.", fields: {} };
  }

  const source = body as Record<string, unknown>;
  const typeErrors: FieldErrors = {};

  const goal = readField(source, "goal", typeErrors);
  const role = readField(source, "role", typeErrors);
  const outputType = readField(source, "outputType", typeErrors);
  const tone = readField(source, "tone", typeErrors);
  const audience = readField(source, "audience", typeErrors);
  const length = readField(source, "length", typeErrors);
  const constraints = readField(source, "constraints", typeErrors);

  const errors: FieldErrors = {
    ...validateGeneratorInput({ goal, role, outputType, tone, audience, length, constraints }),
    ...typeErrors,
  };

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Some fields need attention.", fields: errors };
  }

  // Safe: validateGeneratorInput only passes when isOutputType(outputType) held.
  const checkedOutputType = outputType as OutputType;

  return {
    ok: true,
    input: {
      goal,
      role,
      outputType: checkedOutputType,
      tone: tone || undefined,
      audience: audience || undefined,
      length: length || undefined,
      constraints: constraints || undefined,
    },
  };
}
