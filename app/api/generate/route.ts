import { NextResponse } from "next/server";
import { requestMasterPrompt } from "@/lib/openrouter";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { parseGeneratorInput } from "@/lib/validation";
import type { GenerateErrorCode, GenerateErrorResponse } from "@/lib/types";

// The in-memory rate limiter needs a long-lived Node process.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Largest request body we will even parse. Every field is capped far below this. */
const MAX_BODY_BYTES = 32_768;

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
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...options.headers },
  });
}

/**
 * POST /api/generate
 *
 * Pipeline: rate limit → size guard → validate → OpenRouter → respond.
 * The API key never leaves this process: the browser only ever talks to this
 * route, and every failure is returned as JSON with a matching status code.
 */
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

  // 2. Reject absurd bodies before parsing them.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.", {
      headers: limitHeaders,
    });
  }

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

  // 3. Generate. Configuration is checked inside, once the request is worth
  //    spending money on.
  const outcome = await requestMasterPrompt(parsed.input);
  if (!outcome.ok) {
    return jsonError(outcome.status, outcome.code, outcome.message, { headers: limitHeaders });
  }

  return NextResponse.json(
    { prompt: outcome.prompt, model: outcome.model },
    { headers: { ...limitHeaders, "Cache-Control": "no-store" } },
  );
}

export function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Use POST for this endpoint.", {
    headers: { Allow: "POST" },
  });
}
