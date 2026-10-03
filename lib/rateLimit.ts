/**
 * Minimal in-memory, fixed-window rate limiter.
 *
 * Scope: one process, one window per caller. It is deliberately dependency-free
 * and good enough to stop a public demo from draining API credits. On a
 * multi-instance host (e.g. Vercel serverless) each instance keeps its own
 * counters — swap this for a shared store such as Upstash Redis if you need a
 * hard guarantee, and note that Vercel's default runtime may create several
 * instances under load.
 */

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Stops the map growing without bound on a long-lived server. */
const MAX_TRACKED_CALLERS = 5_000;

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets — used for Retry-After. */
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
};

/**
 * Best-effort caller identity from proxy headers, falling back to a shared bucket.
 * These headers are only trustworthy when the app runs behind a platform that
 * sets them (Vercel, Cloudflare, nginx). If a client can reach the server
 * directly, it can spoof them — terminate traffic at a trusted proxy first.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function pruneExpired(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/** Records one request for `key` and reports whether it is allowed. */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_CALLERS) pruneExpired(now);
    windows.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
    };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - existing.count,
  };
}
