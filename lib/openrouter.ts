import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/metaPrompt";
import type { GenerateErrorCode, GeneratorInput } from "@/lib/types";

/**
 * The OpenRouter call: request shaping, timeout, and mapping upstream failures
 * onto our own error contract. Kept apart from the route handler so the
 * endpoint reads as a pipeline and this part can be reasoned about on its own.
 */

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_SITE_NAME = "Master Prompt Builder";

const MAX_OUTPUT_TOKENS = 2400;
const TIMEOUT_MS = 45_000;
/** Below this the model clearly ignored the brief; treated as an upstream failure. */
const MIN_PROMPT_LENGTH = 200;

export type OpenRouterOutcome =
  | { ok: true; prompt: string; model: string }
  | { ok: false; status: number; code: GenerateErrorCode; message: string };

/** Upstream status codes worth explaining to the user, mapped to our own. */
type StatusMapping = { status: number; code: GenerateErrorCode; message: string };
const STATUS_MAP: Record<number, StatusMapping> = {
  401: {
    status: 502,
    code: "UPSTREAM_ERROR",
    message: "OpenRouter rejected the API key. Check OPENROUTER_API_KEY.",
  },
  402: {
    status: 502,
    code: "UPSTREAM_ERROR",
    message: "OpenRouter reports insufficient credits for this account.",
  },
  429: {
    status: 503,
    code: "UPSTREAM_ERROR",
    message: "OpenRouter is rate limiting this key. Try again shortly.",
  },
};

function config() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY?.trim() ?? "",
    model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
    baseUrl: (process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
    siteUrl: process.env.OPENROUTER_SITE_URL?.trim() || DEFAULT_SITE_URL,
    siteName: process.env.OPENROUTER_SITE_NAME?.trim() || DEFAULT_SITE_NAME,
  };
}

/**
 * Removes a code fence wrapped around the entire response. Handles a matched
 * pair and the common case of an opening fence the model never closed.
 */
export function normalizePrompt(raw: string): string {
  let text = raw.trim();
  const wrapped = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(text);
  if (wrapped?.[1]) return wrapped[1].trim();
  text = text.replace(/^```[a-zA-Z]*\s*\n?/, "");
  text = text.replace(/\n?```$/, "");
  return text.trim();
}

/** Extracts the assistant message from an OpenAI-compatible chat completion. */
function extractContent(payload: unknown): { content: string; model: string } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const data = payload as {
    model?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return { content, model: typeof data.model === "string" ? data.model : DEFAULT_MODEL };
}

export async function requestMasterPrompt(input: GeneratorInput): Promise<OpenRouterOutcome> {
  const { apiKey, model, baseUrl, siteUrl, siteName } = config();

  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      code: "MISSING_API_KEY",
      message: "Server is missing OPENROUTER_API_KEY. Add it to .env.local and restart the server.",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Recommended by OpenRouter for attribution and dashboards.
        "HTTP-Referer": siteUrl,
        "X-Title": siteName,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(input) },
        ],
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      code: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
      message: timedOut
        ? "OpenRouter took too long to respond. Try again or pick a faster model."
        : "Could not reach OpenRouter. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    // Drain the body so the connection can be reused. Upstream text is never
    // echoed to the client — it can contain account or request identifiers.
    await response.text().catch(() => undefined);
    const mapped: StatusMapping = STATUS_MAP[response.status] ?? {
      status: 502,
      code: "UPSTREAM_ERROR",
      message: `OpenRouter returned an error (${response.status}).`,
    };
    return { ok: false, ...mapped };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "OpenRouter returned a malformed response.",
    };
  }

  const extracted = extractContent(payload);
  if (!extracted) {
    return {
      ok: false,
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "OpenRouter returned no usable text.",
    };
  }

  const prompt = normalizePrompt(extracted.content);
  if (prompt.length < MIN_PROMPT_LENGTH) {
    return {
      ok: false,
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "The model returned an unusably short prompt. Try again or switch OPENROUTER_MODEL.",
    };
  }

  return { ok: true, prompt, model: extracted.model };
}
