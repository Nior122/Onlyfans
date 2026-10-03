"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  /** Accessible name, e.g. "Copy" or "Copy prompt". */
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a toast on success. Off by default to keep repeated copies quiet. */
  notify?: boolean;
  /** Adds a visible "Copy" label next to the icon, for dialogs and footers. */
  showLabel?: boolean;
  className?: string;
};

const FEEDBACK_MS = 2000;

/**
 * Icon-only copy button. Feedback is the icon swapping to a check in the
 * success colour for two seconds, announced through a live region; the icon
 * never shifts the row width because both glyphs are the same size.
 */
export function CopyButton({
  text,
  label = "Copy",
  variant = "secondary",
  size = "icon",
  notify = false,
  showLabel = false,
  className,
}: CopyButtonProps) {
  const [result, setResult] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    setResult(ok ? "copied" : "failed");
    if (ok && notify) toast("Copied to clipboard.");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setResult("idle"), FEEDBACK_MS);
  }

  const copied = result === "copied";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : result === "failed" ? "Copy failed" : label}
      title={copied ? "Copied" : label}
      className={className}
    >
      {copied ? (
        <Check className="text-success" aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
      {/* The word never changes, so the button keeps its width while the icon
          and the live region carry the "copied" feedback. */}
      {showLabel ? <span aria-hidden="true">Copy</span> : null}
      <span className="sr-only" role="status">
        {copied ? "Copied to clipboard" : result === "failed" ? "Copy failed" : ""}
      </span>
    </Button>
  );
}
