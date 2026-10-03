import { resolveCategory } from "@/lib/library";
import { reviveCategories, revivePrompts } from "@/lib/storage";
import type { SavedPrompt } from "@/lib/types";

/**
 * Serialisation for moving a library between browsers: the JSON export file and
 * the import/merge rules. Kept separate from lib/storage.ts, which owns local
 * persistence.
 */

const EXPORT_VERSION = 1;

type LibraryExport = {
  version: number;
  exportedAt: string;
  prompts: SavedPrompt[];
  categories: string[];
};

export function buildExport(prompts: SavedPrompt[], categories: string[]): LibraryExport {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    prompts,
    categories,
  };
}

export function buildExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `master-prompt-library-${date}.json`;
}

/**
 * Accepts either a full export file or a bare array of prompts, so a hand-made
 * file still imports. Returns null when the shape is unusable.
 */
export function parseImport(raw: unknown): { prompts: SavedPrompt[]; categories: string[] } | null {
  const source = Array.isArray(raw)
    ? { prompts: raw, categories: [] }
    : typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : null;
  if (!source) return null;

  // A non-array `prompts` field means this is some other JSON file entirely.
  if (!Array.isArray(source.prompts)) return null;

  const prompts = revivePrompts(source.prompts);
  // reviveCategories always re-adds the defaults, so an export without a
  // categories field still yields a usable list.
  const categories = reviveCategories(Array.isArray(source.categories) ? source.categories : []);

  return { prompts, categories };
}

/** Merges an import into the current library, skipping duplicate ids. */
export function mergeImport(
  currentPrompts: SavedPrompt[],
  currentCategories: string[],
  incoming: { prompts: SavedPrompt[]; categories: string[] },
): { prompts: SavedPrompt[]; categories: string[]; added: number; skipped: number } {
  const categories = reviveCategories([...currentCategories, ...incoming.categories]);

  const existingIds = new Set(currentPrompts.map((prompt) => prompt.id));
  // Imported prompts adopt the existing spelling of their category, so they
  // cannot end up invisible to the category filter.
  const added = incoming.prompts
    .filter((prompt) => !existingIds.has(prompt.id))
    .map((prompt) => ({ ...prompt, category: resolveCategory(categories, prompt.category) }));
  const skipped = incoming.prompts.length - added.length;

  return { prompts: [...added, ...currentPrompts], categories, added: added.length, skipped };
}
