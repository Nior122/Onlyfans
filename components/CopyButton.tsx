"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

const FEEDBACK_MS = 2000;

/** Copies `text` and shows "Copied" for two seconds, with an SR announcement. */
export function CopyButton({ text, label = "Copy", className, disabled }: CopyButtonProps) {
  const [result, setResult] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    setResult(ok ? "copied" : "failed");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setResult("idle"), FEEDBACK_MS);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={cn("btn-secondary", className)}
    >
      {result === "copied" ? (
        <Check className="h-4 w-4 text-brand" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {result === "copied" ? "Copied" : result === "failed" ? "Copy failed" : label}
      <span className="sr-only" role="status">
        {result === "copied"
          ? "Copied to clipboard"
          : result === "failed"
            ? "Copy failed. Select the text and copy manually."
            : ""}
      </span>
    </button>
  );
}
