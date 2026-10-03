import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/metaPrompt";
import { resolveLlmConfig, type LlmConfig } from "@/lib/providers";
import type { GenerateErrorCode, GeneratorInput } from "@/lib/types";

/**
 * One OpenAI-compatible chat-completions client, shared by every provider.
 * Request shaping, timeout and error mapping live here; which endpoint and key
 * are used is decided in `lib/providers.ts` from the environment.
 */

const MAX_OUTPUT_TOKENS = 2400;
const TIMEOUT_MS = 45_000;
/** Below this the model clearly ignored the brief; treated as an upstream failure. */
const MIN_PROMPT_LENGTH = 200;

export type LlmOutcome =
  | { ok: true; prompt: string; model: string }
  | { ok: false; status: number; code: GenerateErrorCode; message: string };

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
function extractContent(payload: unknown, fallbackModel: string): { content: string; model: string } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const data = payload as {
    model?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return { content, model: typeof data.model === "string" ? data.model : fallbackModel };
}

function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

/**
 * Upstream status codes worth explaining, phrased so the fix is obvious.
 * The upstream body itself is never echoed — it can carry account identifiers.
 */
function upstreamFailure(config: LlmConfig, status: number): { status: number; message: string } {
  switch (status) {
    case 401:
    case 403:
      return { status: 502, message: `${config.label} rejected the API key. Check ${config.keyHint}.` };
    case 402:
      return { status: 502, message: `${config.label} reports insufficient credits for this account.` };
    case 404:
      return {
        status: 502,
        message: `No such model or endpoint at ${hostOf(config.baseUrl)}: "${config.model}". Check LLM_MODEL.`,
      };
    case 400:
      return {
        status: 502,
        message:
          `${config.label} rejected the request (HTTP 400). "${config.model}" may not accept ` +
          `${config.maxTokensField} or temperature — see LLM_MAX_TOKENS_FIELD and LLM_TEMPERATURE.`,
      };
    case 429:
      return { status: 503, message: `${config.label} is rate limiting this key. Try again shortly.` };
    default:
      return { status: 502, message: `${config.label} returned an error (HTTP ${status}).` };
  }
}

export async function requestMasterPrompt(input: GeneratorInput): Promise<LlmOutcome> {
  const resolved = resolveLlmConfig();
  if (!resolved.ok) {
    return { ok: false, status: 500, code: resolved.code, message: resolved.message };
  }
  const { config } = resolved;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  // Attribution is only meaningful to OpenRouter; other providers get nothing.
  if (config.siteUrl) headers["HTTP-Referer"] = config.siteUrl;
  if (config.siteName) headers["X-Title"] = config.siteName;

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ],
    [config.maxTokensField]: MAX_OUTPUT_TOKENS,
  };
  if (config.temperature !== undefined) body.temperature = config.temperature;

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      code: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
      message: timedOut
        ? `${config.label} took too long to respond. Try again or pick a faster model.`
        : `Could not reach ${config.label} at ${hostOf(config.baseUrl)}. Check the base URL and your connection.`,
    };
  }

  if (!response.ok) {
    // Drain the body so the connection can be reused.
    await response.text().catch(() => undefined);
    const failure = upstreamFailure(config, response.status);
    return { ok: false, status: failure.status, code: "UPSTREAM_ERROR", message: failure.message };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: 502,
      code: "UPSTREAM_ERROR",
      message: `${config.label} returned a malformed response.`,
    };
  }

  const extracted = extractContent(payload, config.model);
  if (!extracted) {
    return {
      ok: false,
      status: 502,
      code: "UPSTREAM_ERROR",
      message: `${config.label} returned no usable text.`,
    };
  }

  const prompt = normalizePrompt(extracted.content);
  if (prompt.length < MIN_PROMPT_LENGTH) {
    return {
      ok: false,
      status: 502,
      code: "UPSTREAM_ERROR",
      message: `The model returned an unusably short prompt. Try again or switch LLM_MODEL (currently "${config.model}").`,
    };
  }

  return { ok: true, prompt, model: extracted.model };
}
