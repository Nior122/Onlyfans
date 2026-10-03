"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
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
    <section
      aria-labelledby="result-heading"
      aria-busy={state.status === "loading"}
      className="card flex min-h-[24rem] flex-col p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="result-heading" className="text-sm font-semibold">
          Your master prompt
        </h2>

        {state.status === "success" ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="tabular-nums">{sections} of {REQUIRED_SECTIONS} sections</span>
            <span className="tabular-nums">{words} words</span>
            <span className="hidden truncate sm:inline">{state.model}</span>
          </p>
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

      <div className="mt-4 flex-1">
        {/* Keyed by status so each state fades in as it replaces the last. */}
        <motion.div
          key={state.status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {state.status === "idle" ? (
            <div className="grid h-full place-items-center gap-2 rounded-xl border border-dashed border-line px-6 py-12 text-center">
              <FileText className="h-6 w-6 text-muted" aria-hidden="true" />
              <p className="text-sm font-medium">Nothing generated yet</p>
              <p className="max-w-sm text-sm text-muted">
                Fill in your goal, role and output type, then hit Generate. Your structured prompt
                appears here.
              </p>
            </div>
          ) : null}

          {state.status === "loading" ? (
            <div className="space-y-3" aria-hidden="true">
              {[90, 100, 75, 95, 60].map((width, index) => (
                <div
                  key={index}
                  className="h-4 animate-pulse rounded bg-subtle"
                  style={{ width: `${width}%` }}
                />
              ))}
              <p className="flex items-center gap-2 pt-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Writing your master prompt…
              </p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="rounded-xl border border-danger/40 bg-danger/5 p-4">
              <p className="flex items-start gap-2 text-sm font-medium text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {state.message}
              </p>
              {onRegenerate ? (
                <button type="button" onClick={onRegenerate} className="btn-secondary mt-3">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="space-y-4">
              {isEditing ? (
                <textarea
                  value={displayText}
                  onChange={(event) =>
                    setDraft({ source: generatedText, text: event.target.value, editing: true })
                  }
                  aria-label="Edit the generated prompt"
                  className="input min-h-[22rem] resize-y font-mono text-xs leading-relaxed"
                />
              ) : (
                <pre
                  tabIndex={0}
                  role="region"
                  aria-label="Generated master prompt"
                  className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-subtle/50 p-4 font-sans text-sm leading-relaxed"
                >
                  {displayText}
                </pre>
              )}

              {sections < REQUIRED_SECTIONS ? (
                <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  The model returned {sections} of the {REQUIRED_SECTIONS} sections. Try Regenerate
                  for the full structure, or edit the text before saving.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {isEditing ? (
                  <>
                    {/* Keeps the edits and leaves edit mode, so Copy uses the edited text. */}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((previous) => (previous ? { ...previous, editing: false } : previous))
                      }
                      className="btn-primary"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Done editing
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ source: generatedText, text: null, editing: false })}
                      className="btn-secondary"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Discard changes
                    </button>
                  </>
                ) : (
                  <>
                    <CopyButton text={displayText} label="Copy" />
                    {onSave ? (
                      <button
                        type="button"
                        onClick={() => onSave(displayText)}
                        className="btn-secondary"
                      >
                        <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                        Save to library
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ source: generatedText, text: displayText, editing: true })
                      }
                      className="btn-secondary"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    {onRegenerate ? (
                      <button type="button" onClick={onRegenerate} className="btn-secondary">
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Regenerate
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
