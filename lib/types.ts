/** Shared domain types. No runtime dependencies so this is safe on client and server. */

/** Output types offered in the generator form. `Custom` unlocks free-form goals. */
export const OUTPUT_TYPES = [
  "Article",
  "Blog post",
  "Email",
  "Code",
  "Script",
  "Report",
  "Social media post",
  "Lesson plan",
  "Product description",
  "Custom",
] as const;

export type OutputType = (typeof OUTPUT_TYPES)[number];

/** Quick-pick chips for the Role field. The field itself accepts free text. */
export const ROLE_SUGGESTIONS = [
  "Marketing Strategist",
  "Senior Developer",
  "Copywriter",
  "Data Analyst",
  "Teacher",
  "Researcher",
  "Product Manager",
  "Designer",
] as const;

/** Categories a saved prompt can live in; users can add their own. */
export const DEFAULT_CATEGORIES = [
  "Writing",
  "Coding",
  "Marketing",
  "Business",
  "Education",
  "Research",
  "Other",
] as const;

/** What the user types into the generator form. */
export type GeneratorInput = {
  goal: string;
  role: string;
  outputType: OutputType;
  tone?: string;
  audience?: string;
  length?: string;
  constraints?: string;
};

/** A prompt persisted in the browser's localStorage. */
export type SavedPrompt = {
  id: string;
  title: string;
  category: string;
  role: string;
  outputType: OutputType;
  goal: string;
  promptText: string;
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------- API contract ------------------------------ */

/** Successful /api/generate response. */
export type GenerateSuccessResponse = {
  prompt: string;
  model: string;
};

export type GenerateErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "MISSING_API_KEY"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT";

/** Failed /api/generate response. `fields` keys map to form field names. */
export type GenerateErrorResponse = {
  error: {
    code: GenerateErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};

export type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse;

/** Narrowing helper used by the client to branch on success vs failure. */
export function isGenerateSuccess(
  response: GenerateResponse,
): response is GenerateSuccessResponse {
  return typeof (response as GenerateSuccessResponse).prompt === "string";
}

/** Values collected by the save dialog, before a SavedPrompt exists. */
export type NewPromptValues = {
  title: string;
  category: string;
  role: string;
  outputType: OutputType;
  goal: string;
  promptText: string;
};

/** Lifecycle of a single generation request, rendered by the result panel. */
export type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; fields?: Record<string, string> }
  | { status: "success"; prompt: string; model: string };
