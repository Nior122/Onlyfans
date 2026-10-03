"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Route-level error boundary. Without it an unexpected render error would show
 * a blank screen; here the visitor keeps a way forward.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-xl place-items-center px-6 py-16">
      <div className="card w-full p-6 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-danger" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          The page failed to render. Your saved prompts live in this browser and are unaffected.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-muted">Reference: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
