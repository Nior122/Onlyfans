import { reviveCategories } from "@/lib/storage";
import type { NewPromptValues, SavedPrompt } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Pure transformations for the saved-prompt library. Keeping them free of
 * React and storage side effects makes them easy to reason about (and to test
 * without a browser).
 */

export const MAX_TITLE_LENGTH = 120;
const MAX_CATEGORY_LENGTH = 40;

/** Trims and caps a title, falling back to a placeholder rather than empty. */
function cleanTitle(title: string): string {
  const trimmed = title.trim().slice(0, MAX_TITLE_LENGTH);
  return trimmed || "Untitled prompt";
}

/** Builds a new SavedPrompt from dialog values. */
export function createSavedPrompt(values: NewPromptValues, now = new Date().toISOString()): SavedPrompt {
  return {
    id: uid(),
    title: cleanTitle(values.title),
    category: values.category.trim().slice(0, MAX_CATEGORY_LENGTH) || "Other",
    role: values.role.trim(),
    outputType: values.outputType,
    goal: values.goal,
    promptText: values.promptText,
    createdAt: now,
    updatedAt: now,
  };
}

/** Applies a partial edit to one prompt and refreshes `updatedAt`. */
export function applyPromptUpdate(
  prompts: SavedPrompt[],
  id: string,
  patch: Partial<NewPromptValues>,
  now = new Date().toISOString(),
): SavedPrompt[] {
  return prompts.map((prompt) =>
    prompt.id === id
      ? {
          ...prompt,
          ...patch,
          title: cleanTitle(patch.title ?? prompt.title),
          category: (patch.category ?? prompt.category).trim() || prompt.category,
          updatedAt: now,
        }
      : prompt,
  );
}

export function removePrompt(prompts: SavedPrompt[], id: string): SavedPrompt[] {
  return prompts.filter((prompt) => prompt.id !== id);
}

/** Adds a category if it is new, keeping the defaults and de-duplicating. */
export function withAddedCategory(categories: string[], name: string): string[] {
  return reviveCategories([...categories, name.trim().slice(0, MAX_CATEGORY_LENGTH)]);
}

export function withRemovedCategory(categories: string[], name: string): string[] {
  return categories.filter((category) => category !== name);
}

/** Moves prompts out of a removed category so none are orphaned. */
export function reassignCategory(
  prompts: SavedPrompt[],
  from: string,
  to = "Other",
): SavedPrompt[] {
  return prompts.map((prompt) => (prompt.category === from ? { ...prompt, category: to } : prompt));
}

/**
 * Normalises a category name against the existing list: "writing" becomes
 * "Writing" when that category already exists. Without this, a prompt saved
 * with different casing would not match the category filter.
 */
export function resolveCategory(categories: string[], name: string): string {
  const trimmed = name.trim().slice(0, MAX_CATEGORY_LENGTH) || "Other";
  return categories.find((category) => category.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

export function categoryExists(categories: string[], name: string): boolean {
  const needle = name.trim().toLowerCase();
  return categories.some((category) => category.toLowerCase() === needle);
}

export function countInCategory(prompts: SavedPrompt[], category: string): number {
  return prompts.filter((prompt) => prompt.category === category).length;
}
