"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GeneratorForm } from "@/components/GeneratorForm";
import { ResultPanel } from "@/components/ResultPanel";
import {
  isGenerateSuccess,
  type GenerateErrorResponse,
  type GenerateResponse,
  type GenerationState,
  type GeneratorInput,
} from "@/lib/types";

/**
 * Owns the generation lifecycle for one Builder tab: the form below only
 * collects input, and the result panel below only renders state.
 */
export function BuilderView() {
  const [state, setState] = useState<GenerationState>({ status: "idle" });
  const [lastInput, setLastInput] = useState<GeneratorInput | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <GeneratorForm
        isGenerating={state.status === "loading"}
        onGenerate={(input) => void generate(input)}
        externalErrors={state.status === "error" ? state.fields : undefined}
      />
      <ResultPanel
        state={state}
        onRegenerate={lastInput ? regenerate : undefined}
      />
    </div>
  );
}
