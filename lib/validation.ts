import type { GeneratorInput, OutputType } from "@/lib/types";
import { OUTPUT_TYPES } from "@/lib/types";

/** Hard caps per field, enforced on the server and reused by the form. */
export const FIELD_LIMITS = {
  goal: 2000,
  role: 120,
  outputType: 60,
  tone: 120,
  audience: 300,
  length: 120,
  constraints: 1000,
} as const;

/** Minimum length for the goal — shorter text cannot produce a useful prompt. */
export const GOAL_MIN_LENGTH = 10;

export type ValidationSuccess = { ok: true; input: GeneratorInput };
export type ValidationFailure = {
  ok: false;
  message: string;
  fields: Record<string, string>;
};
export type ValidationResult = ValidationSuccess | ValidationFailure;

/** Drops control characters (keeping newlines and tabs) and tidies whitespace. */
function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Reads an optional string field, returning undefined when absent or blank. */
function readOptional(
  source: Record<string, unknown>,
  key: keyof typeof FIELD_LIMITS,
  fields: Record<string, string>,
): string | undefined {
  const raw = source[key];
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "string") {
    fields[key] = "Must be text.";
    return undefined;
  }
  const value = sanitizeText(raw);
  if (!value) return undefined;
  if (value.length > FIELD_LIMITS[key]) {
    fields[key] = `Keep this under ${FIELD_LIMITS[key]} characters.`;
    return undefined;
  }
  return value;
}

/**
 * Validates an untrusted request body and returns a typed GeneratorInput.
 * Never throws: callers branch on `ok`.
 */
export function parseGeneratorInput(body: unknown): ValidationResult {
  const fields: Record<string, string> = {};

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object.", fields };
  }

  const source = body as Record<string, unknown>;

  // Goal — required.
  let goal = "";
  if (typeof source.goal !== "string") {
    fields.goal = "Describe your goal.";
  } else {
    goal = sanitizeText(source.goal);
    if (goal.length < GOAL_MIN_LENGTH) {
      fields.goal = `Add a little more detail (at least ${GOAL_MIN_LENGTH} characters).`;
    } else if (goal.length > FIELD_LIMITS.goal) {
      fields.goal = `Keep this under ${FIELD_LIMITS.goal} characters.`;
    }
  }

  // Role — required, free text.
  let role = "";
  if (typeof source.role !== "string") {
    fields.role = "Add a role.";
  } else {
    role = sanitizeText(source.role);
    if (role.length < 2) {
      fields.role = "Add a role.";
    } else if (role.length > FIELD_LIMITS.role) {
      fields.role = `Keep this under ${FIELD_LIMITS.role} characters.`;
    }
  }

  // Output type — required, must be one of the known options.
  let outputType: OutputType | undefined;
  if (typeof source.outputType !== "string") {
    fields.outputType = "Choose an output type.";
  } else {
    const candidate = sanitizeText(source.outputType);
    if (!(OUTPUT_TYPES as readonly string[]).includes(candidate)) {
      fields.outputType = "Choose an output type from the list.";
    } else {
      outputType = candidate as OutputType;
    }
  }

  const tone = readOptional(source, "tone", fields);
  const audience = readOptional(source, "audience", fields);
  const length = readOptional(source, "length", fields);
  const constraints = readOptional(source, "constraints", fields);

  if (Object.keys(fields).length > 0 || !outputType) {
    return { ok: false, message: "Some fields need attention.", fields };
  }

  return {
    ok: true,
    input: { goal, role, outputType, tone, audience, length, constraints },
  };
}
