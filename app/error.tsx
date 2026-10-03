"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
    <main className="mx-auto grid min-h-dvh w-full max-w-container place-items-center px-6 py-16 sm:px-8">
      <Card className="w-full max-w-md text-left">
        <AlertTriangle className="size-4 text-error" aria-hidden="true" />
        <h1 className="mt-3 text-section font-semibold">Something went wrong</h1>
        <p className="mt-2 text-body text-fg-secondary">
          The page failed to render. Your saved prompts live in this browser and are unaffected.
        </p>
        <Button onClick={reset} className="mt-4">
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
        {error.digest ? (
          <p className="mt-4 font-mono text-label text-fg-muted">Reference: {error.digest}</p>
        ) : null}
      </Card>
    </main>
  );
}
