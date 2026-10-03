"use client";

import { useCallback } from "react";
import type { useToast } from "@/components/ui/Toast";
import { mergeImport } from "@/lib/libraryFile";
import {
  applyPromptUpdate,
  categoryExists,
  createSavedPrompt,
  reassignCategory,
  resolveCategory,
  removePrompt,
  withAddedCategory,
  withRemovedCategory,
} from "@/lib/library";
import { buildExport, buildExportFilename, parseImport } from "@/lib/libraryFile";
import { categoriesStore, promptsStore } from "@/lib/storage";
import type { NewPromptValues, SavedPrompt } from "@/lib/types";
import { downloadJson } from "@/lib/utils";

export type ImportResult = { added: number; skipped: number } | null;

/** Guard rail: a library export should never be anywhere near this large. */
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

type LibraryActions = {
  savePrompt: (values: NewPromptValues) => SavedPrompt | null;
  updatePrompt: (id: string, patch: Partial<NewPromptValues>) => void;
  deletePrompt: (id: string) => void;
  addCategory: (name: string) => boolean;
  deleteCategory: (name: string) => void;
  exportLibrary: () => void;
  importLibrary: (file: File) => Promise<ImportResult>;
};

type Toast = ReturnType<typeof useToast>["toast"];

/**
 * Library mutations: pure transformations from lib/library.ts plus persistence
 * and user feedback. Every write checks the result, because localStorage can
 * refuse (quota, private mode) and silently losing a prompt would be worse than
 * an error message.
 */
export function useLibraryActions(
  prompts: SavedPrompt[],
  categories: string[],
  toast: Toast,
): LibraryActions {
  const savePrompt = useCallback(
    (values: NewPromptValues): SavedPrompt | null => {
      const prompt = createSavedPrompt({
        ...values,
        category: resolveCategory(categories, values.category),
      });

      if (!promptsStore.write([prompt, ...prompts])) {
        toast("Could not save: this browser blocked local storage.", "error");
        return null;
      }
      // Keep a custom category around once it has been used.
      if (!categoryExists(categories, prompt.category)) {
        categoriesStore.write(withAddedCategory(categories, prompt.category));
      }

      toast("Saved to your library.");
      return prompt;
    },
    [categories, prompts, toast],
  );

  const updatePrompt = useCallback(
    (id: string, patch: Partial<NewPromptValues>) => {
      const resolvedPatch = patch.category
        ? { ...patch, category: resolveCategory(categories, patch.category) }
        : patch;
      if (!promptsStore.write(applyPromptUpdate(prompts, id, resolvedPatch))) {
        toast("Could not update: this browser blocked local storage.", "error");
        return;
      }
      if (patch.category && !categoryExists(categories, patch.category)) {
        categoriesStore.write(withAddedCategory(categories, patch.category));
      }
      toast("Prompt updated.");
    },
    [categories, prompts, toast],
  );

  const deletePrompt = useCallback(
    (id: string) => {
      const target = prompts.find((prompt) => prompt.id === id);
      if (!promptsStore.write(removePrompt(prompts, id))) {
        toast("Could not delete: this browser blocked local storage.", "error");
        return;
      }
      toast(target ? `Deleted “${target.title}”.` : "Prompt deleted.");
    },
    [prompts, toast],
  );

  const addCategory = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) {
        toast("Enter a category name.", "error");
        return false;
      }
      if (categoryExists(categories, trimmed)) {
        toast(`“${trimmed}” already exists.`, "error");
        return false;
      }
      if (!categoriesStore.write(withAddedCategory(categories, trimmed))) {
        toast("Could not add the category: storage is blocked.", "error");
        return false;
      }
      toast(`Category “${trimmed}” added.`);
      return true;
    },
    [categories, toast],
  );

  const deleteCategory = useCallback(
    (name: string) => {
      if (!categoriesStore.write(withRemovedCategory(categories, name))) {
        toast("Could not remove the category: storage is blocked.", "error");
        return;
      }
      // Prompts in a removed category fall back to "Other" rather than vanishing.
      const affected = prompts.some((prompt) => prompt.category === name);
      if (affected) promptsStore.write(reassignCategory(prompts, name));

      toast(
        affected
          ? `Category “${name}” removed. Its prompts moved to “Other”.`
          : `Category “${name}” removed.`,
      );
    },
    [categories, prompts, toast],
  );

  const exportLibrary = useCallback(() => {
    if (prompts.length === 0) {
      toast("Nothing to export yet.", "error");
      return;
    }
    downloadJson(buildExportFilename(), buildExport(prompts, categories));
    toast(`Exported ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}.`);
  }, [categories, prompts, toast]);

  const importLibrary = useCallback(
    async (file: File): Promise<ImportResult> => {
      if (file.size > MAX_IMPORT_BYTES) {
        toast("That file is too large to be a prompt library export.", "error");
        return null;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(await file.text()) as unknown;
      } catch {
        toast("That file is not valid JSON.", "error");
        return null;
      }

      const parsed = parseImport(raw);
      if (!parsed) {
        toast("That file is not a prompt library export.", "error");
        return null;
      }

      const merged = mergeImport(prompts, categories, parsed);
      if (merged.added === 0 && merged.skipped === 0) {
        toast("No prompts found in that file.", "error");
        return null;
      }

      const wrotePrompts = promptsStore.write(merged.prompts);
      const wroteCategories = categoriesStore.write(merged.categories);
      if (!wrotePrompts || !wroteCategories) {
        toast("Import failed: this browser blocked local storage.", "error");
        return null;
      }

      toast(
        `Imported ${merged.added} prompt${merged.added === 1 ? "" : "s"}${
          merged.skipped > 0
            ? `, skipped ${merged.skipped} duplicate${merged.skipped === 1 ? "" : "s"}`
            : ""
        }.`,
      );
      return { added: merged.added, skipped: merged.skipped };
    },
    [categories, prompts, toast],
  );

  return {
    savePrompt,
    updatePrompt,
    deletePrompt,
    addCategory,
    deleteCategory,
    exportLibrary,
    importLibrary,
  };
}
