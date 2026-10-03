/** localStorage keys used across the app, kept in one place to avoid typos. */
export const STORAGE_KEYS = {
  theme: "mpb:theme",
  prompts: "mpb:prompts",
  categories: "mpb:categories",
  lastInput: "mpb:last-input",
} as const;

/**
 * Joins conditional class names. Deliberately tiny: the app never needs
 * conflicting-class resolution, so no extra dependency is required.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
