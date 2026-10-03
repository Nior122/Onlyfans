import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/metaPrompt";
import { getClientIp, checkRateLimit } from "@/lib/rateLimit";
import { parseGeneratorInput } from "@/lib/validation";
import type { GenerateErrorCode, GenerateErrorResponse } from "@/lib/types";

// The in-memory rate limiter needs a long-lived Node process.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const MAX_OUTPUT_TOKENS = 2400;
const UPSTREAM_TIMEOUT_MS = 45_000;
/** Below this the model clearly ignored the brief; treated as an upstream failure. */
const MIN_PROMPT_LENGTH = 200;

type ErrorOptions = {
  fields?: Record<string, string>;
  headers?: Record<string, string>;
};

function jsonError(
  status: number,
  code: GenerateErrorCode,
  message: string,
  options: ErrorOptions = {},
) {
  const body: GenerateErrorResponse = {
    error: { code, message, ...(options.fields ? { fields: options.fields } : {}) },
  };
  return NextResponse.json(body, { status, headers: options.headers });
}

/** Removes a code fence wrapped around the entire response, if present. */
function normalizePrompt(raw: string): string {
  const text = raw.trim();
  const wrapped = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(text);
  return (wrapped?.[1] ?? text).trim();
}

/** Upstream status codes worth explaining to the user, mapped to our own. */
type UpstreamMapping = { status: number; code: GenerateErrorCode; message: string };
const UPSTREAM_STATUS_MAP: Record<number, UpstreamMapping> = {
  401: { status: 502, code: "UPSTREAM_ERROR", message: "OpenRouter rejected the API key. Check OPENROUTER_API_KEY." },
  402: { status: 502, code: "UPSTREAM_ERROR", message: "OpenRouter reports insufficient credits for this account." },
  429: { status: 503, code: "UPSTREAM_ERROR", message: "OpenRouter is rate limiting this key. Try again shortly." },
};

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

export async function POST(request: Request) {
  // 1. Rate limit first: it must also cover malformed and repeated requests.
  const limit = checkRateLimit(getClientIp(request.headers));
  const limitHeaders = {
    "X-RateLimit-Limit": String(limit.limit),
    "X-RateLimit-Remaining": String(limit.remaining),
  };

  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.", {
      headers: { ...limitHeaders, "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  // 2. Parse and validate the body — bad input is answered precisely and
  //    never reaches the upstream call.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.", {
      headers: limitHeaders,
    });
  }

  const parsed = parseGeneratorInput(body);
  if (!parsed.ok) {
    return jsonError(400, "VALIDATION_ERROR", parsed.message, {
      fields: parsed.fields,
      headers: limitHeaders,
    });
  }

  // 3. Configuration check, once we know the request is worth spending money on.
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return jsonError(
      500,
      "MISSING_API_KEY",
      "Server is missing OPENROUTER_API_KEY. Add it to .env.local and restart the server.",
      { headers: limitHeaders },
    );
  }

  // 4. Call OpenRouter with a hard timeout.
  const baseUrl = (process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Recommended by OpenRouter for attribution and dashboards.
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_NAME?.trim() || "Master Prompt Builder",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(parsed.input) },
        ],
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return jsonError(
      timedOut ? 504 : 502,
      timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
      timedOut
        ? "OpenRouter took too long to respond. Try again or pick a faster model."
        : "Could not reach OpenRouter. Check your connection and try again.",
      { headers: limitHeaders },
    );
  }

  // 5. Surface upstream failures without leaking request details.
  if (!response.ok) {
    // Drain the body so the connection can be reused. Upstream text is never
    // echoed to the client — it can contain account or request identifiers.
    await response.text().catch(() => undefined);
    const mapped = UPSTREAM_STATUS_MAP[response.status] ?? {
      status: 502,
      code: "UPSTREAM_ERROR" as GenerateErrorCode,
      message: `OpenRouter returned an error (${response.status}).`,
    };
    return jsonError(mapped.status, mapped.code, mapped.message, { headers: limitHeaders });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return jsonError(502, "UPSTREAM_ERROR", "OpenRouter returned a malformed response.", {
      headers: limitHeaders,
    });
  }

  const extracted = extractContent(payload);
  if (!extracted) {
    return jsonError(502, "UPSTREAM_ERROR", "OpenRouter returned no usable text.", {
      headers: limitHeaders,
    });
  }

  const prompt = normalizePrompt(extracted.content);
  if (prompt.length < MIN_PROMPT_LENGTH) {
    return jsonError(
      502,
      "UPSTREAM_ERROR",
      "The model returned an unusably short prompt. Try again or switch OPENROUTER_MODEL.",
      { headers: limitHeaders },
    );
  }

  return NextResponse.json({ prompt, model: extracted.model }, { headers: limitHeaders });
}

export function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Use POST for this endpoint.", {
    headers: { Allow: "POST" },
  });
}
