"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { useToast } from "@/components/Toast";
import { useLibraryActions, type ImportResult } from "@/components/useLibraryActions";
import { categoriesStore, isStorageAvailable, promptsStore } from "@/lib/storage";
import type { NewPromptValues, SavedPrompt } from "@/lib/types";

export type { ImportResult };

type LibraryContextValue = {
  prompts: SavedPrompt[];
  categories: string[];
  /** False until the first client render, so views can avoid flashing empty states. */
  ready: boolean;
  storageAvailable: boolean;
  savePrompt: (values: NewPromptValues) => SavedPrompt | null;
  updatePrompt: (id: string, patch: Partial<NewPromptValues>) => void;
  deletePrompt: (id: string) => void;
  addCategory: (name: string) => boolean;
  deleteCategory: (name: string) => void;
  exportLibrary: () => void;
  importLibrary: (file: File) => Promise<ImportResult>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within a LibraryProvider");
  return context;
}

/** `true` only on the client: the server render reports `false`. */
function subscribeToNothing() {
  return () => {};
}
function getClientReady() {
  return true;
}
function getServerReady() {
  return false;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  // useSyncExternalStore returns the server snapshot during hydration, so the
  // first client render matches the markup, then immediately re-renders with
  // whatever is actually in localStorage.
  const prompts = useSyncExternalStore(
    promptsStore.subscribe,
    promptsStore.read,
    promptsStore.readServer,
  );
  const categories = useSyncExternalStore(
    categoriesStore.subscribe,
    categoriesStore.read,
    categoriesStore.readServer,
  );
  const ready = useSyncExternalStore(subscribeToNothing, getClientReady, getServerReady);

  const actions = useLibraryActions(prompts, categories, toast);

  const value = useMemo<LibraryContextValue>(
    () => ({
      prompts,
      categories,
      ready,
      storageAvailable: ready ? isStorageAvailable() : true,
      ...actions,
    }),
    [actions, categories, prompts, ready],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
