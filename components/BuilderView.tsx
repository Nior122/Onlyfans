"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GeneratorForm } from "@/components/GeneratorForm";
import { useLibrary } from "@/components/LibraryProvider";
import { ResultPanel } from "@/components/ResultPanel";
import { SavePromptDialog } from "@/components/SavePromptDialog";
import {
  isGenerateSuccess,
  type GenerateErrorResponse,
  type GenerateResponse,
  type GenerationState,
  type GeneratorInput,
} from "@/lib/types";
import { guessCategory, suggestTitle } from "@/lib/utils";
import { isOutputType } from "@/lib/validation";

/**
 * Owns the generation lifecycle for the Builder tab: the form only collects
 * input, the result panel only renders state, and this wires them to the API
 * and the saved-prompt library.
 */
export function BuilderView() {
  const [state, setState] = useState<GenerationState>({ status: "idle" });
  const [lastInput, setLastInput] = useState<GeneratorInput | null>(null);
  const [pendingSave, setPendingSave] = useState<string | null>(null);
  /** Increments per save request so the dialog remounts with fresh initial values. */
  const [saveRequestId, setSaveRequestId] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const { savePrompt } = useLibrary();

  // Cancel any in-flight request when the view unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(async (input: GeneratorInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLastInput(input);
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as GenerateResponse | null;

      if (!response.ok || !data || !isGenerateSuccess(data)) {
        const error = (data as GenerateErrorResponse | null)?.error;
        setState({
          status: "error",
          message: error?.message ?? `The request failed (HTTP ${response.status}).`,
          fields: error?.fields,
        });
        return;
      }

      setState({ status: "success", prompt: data.prompt, model: data.model });
    } catch (error) {
      // A newer request (or unmount) cancelled this one: keep the newer state.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({
        status: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    }
  }, []);

  const regenerate = useCallback(() => {
    if (lastInput) void generate(lastInput);
  }, [generate, lastInput]);

  const outputType = lastInput && isOutputType(lastInput.outputType) ? lastInput.outputType : "Custom";

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-8">
        <GeneratorForm
          isGenerating={state.status === "loading"}
          onGenerate={(input) => void generate(input)}
          externalErrors={state.status === "error" ? state.fields : undefined}
        />
        {/* Sticky on desktop so the prompt stays in view while the form scrolls. */}
        <div className="lg:sticky lg:top-20">
          <ResultPanel
            state={state}
            onRegenerate={lastInput ? regenerate : undefined}
            onSave={(promptText) => {
              setPendingSave(promptText);
              setSaveRequestId((id) => id + 1);
            }}
          />
        </div>
      </div>

      {/* Keyed so the dialog re-initialises with the current prompt each time. */}
      {pendingSave !== null ? (
        <SavePromptDialog
          key={saveRequestId}
          open
          mode="create"
          initial={{
            title: suggestTitle(lastInput?.goal ?? "Untitled prompt"),
            category: guessCategory(outputType),
            role: lastInput?.role ?? "",
            outputType,
            goal: lastInput?.goal ?? "",
            promptText: pendingSave,
          }}
          onClose={() => setPendingSave(null)}
          onSubmit={(values) => {
            savePrompt(values);
            setPendingSave(null);
          }}
        />
      ) : null}
    </>
  );
}
