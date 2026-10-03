"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BookmarkPlus, Check, FileText, Pencil, RefreshCw, X } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import type { GenerationState } from "@/lib/types";
import { countSections, countWords } from "@/lib/utils";

const REQUIRED_SECTIONS = 7;

type ResultPanelProps = {
  state: GenerationState;
  /** Re-runs the last request. Absent until a first generation has been made. */
  onRegenerate?: () => void;
  /** Receives the current text (including any edits) so it can be saved. */
  onSave?: (promptText: string) => void;
};

/**
 * The generated prompt: header row with the title and actions, then the prompt
 * body scrolling inside the card. States: empty, loading, error, success.
 */
export function ResultPanel({ state, onRegenerate, onSave }: ResultPanelProps) {
  /**
   * One draft record, tagged with the prompt it belongs to. Because the shown
   * text is derived, a new generation automatically drops a stale draft and no
   * reset effect is needed. `text: null` means "unedited".
   */
  const [draft, setDraft] = useState<{ source: string; text: string | null; editing: boolean } | null>(
    null,
  );

  const generatedText = state.status === "success" ? state.prompt : "";
  const activeDraft = draft && draft.source === generatedText ? draft : null;
  const displayText = activeDraft?.text ?? generatedText;
  const isEditing = activeDraft?.editing === true;

  const words = countWords(displayText);
  const sections = countSections(displayText);

  return (
    <Card padding="none" className="flex min-h-[24rem] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-body font-semibold">Generated prompt</h2>
          {state.status === "success" ? (
            <p className="text-label text-fg-muted">
              {sections} of {REQUIRED_SECTIONS} sections
              <span aria-hidden="true"> · </span>
              {words} words
            </p>
          ) : null}
        </div>

        {state.status === "success" ? (
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                {/* Keeps the edits and leaves edit mode, so Copy uses the edited text. */}
                <Button
                  onClick={() =>
                    setDraft((previous) => (previous ? { ...previous, editing: false } : previous))
                  }
                >
                  <Check aria-hidden="true" />
                  Done
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDraft({ source: generatedText, text: null, editing: false })}
                >
                  <X aria-hidden="true" />
                  Discard
                </Button>
              </>
            ) : (
              <>
                <CopyButton text={displayText} label="Copy prompt" />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setDraft({ source: generatedText, text: displayText, editing: true })}
                  aria-label="Edit prompt"
                  title="Edit"
                >
                  <Pencil aria-hidden="true" />
                </Button>
                {onRegenerate ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onRegenerate}
                    aria-label="Regenerate prompt"
                    title="Regenerate"
                  >
                    <RefreshCw aria-hidden="true" />
                  </Button>
                ) : null}
                {onSave ? (
                  <Button onClick={() => onSave(displayText)}>
                    <BookmarkPlus aria-hidden="true" />
                    <span className="hidden sm:inline">Save to library</span>
                    <span className="sm:hidden">Save</span>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Screen-reader status line: the prompt body itself is never announced. */}
      <p className="sr-only" role="status">
        {state.status === "loading"
          ? "Generating your master prompt."
          : state.status === "error"
            ? `Generation failed. ${state.message}`
            : state.status === "success"
              ? `Prompt ready: ${sections} sections, ${words} words.`
              : ""}
      </p>

      <div className="flex-1 p-4 sm:p-5" aria-busy={state.status === "loading"}>
        {/* Keyed by status so each state fades in as it replaces the last. */}
        <motion.div
          key={state.status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="h-full"
        >
          {state.status === "idle" ? (
            <p className="flex items-start gap-2 text-body text-fg-muted">
              <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Your prompt will appear here — fill in your goal, role and output type, then generate.
            </p>
          ) : null}

          {state.status === "loading" ? (
            <div className="space-y-3" aria-hidden="true">
              {[88, 96, 72, 92, 64, 80].map((width) => (
                <Skeleton key={width} className="h-4" style={{ width: `${width}%` }} />
              ))}
              <p className="pt-2 text-label text-fg-muted">Writing your master prompt…</p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="rounded-card border border-error/40 p-4">
              <p className="flex items-start gap-2 text-body">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" aria-hidden="true" />
                {state.message}
              </p>
              {onRegenerate ? (
                <Button variant="secondary" onClick={onRegenerate} className="mt-4">
                  <RefreshCw aria-hidden="true" />
                  Try again
                </Button>
              ) : null}
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="space-y-4">
              {isEditing ? (
                <Textarea
                  id="prompt-draft"
                  label="Edit the generated prompt"
                  labelHidden
                  rows={14}
                  value={displayText}
                  onChange={(event) =>
                    setDraft({ source: generatedText, text: event.target.value, editing: true })
                  }
                  className="min-h-[24rem] leading-prompt"
                />
              ) : (
                <pre
                  tabIndex={0}
                  role="region"
                  aria-label="Generated master prompt"
                  className="max-h-[32rem] max-w-prose overflow-auto whitespace-pre-wrap break-words text-body leading-prompt"
                >
                  {displayText}
                </pre>
              )}

              {sections < REQUIRED_SECTIONS ? (
                <p className="text-label text-fg-muted">
                  The model returned {sections} of the {REQUIRED_SECTIONS} sections. Regenerate for
                  the full structure, or edit before saving.
                </p>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </div>
    </Card>
  );
}
