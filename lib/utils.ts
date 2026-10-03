import type { OutputType } from "@/lib/types";

/** localStorage keys used across the app, kept in one place to avoid typos. */
export const STORAGE_KEYS = {
  theme: "mpb:theme",
  prompts: "mpb:prompts",
  categories: "mpb:categories",
} as const;

/**
 * Joins conditional class names. Deliberately tiny: the app never needs
 * conflicting-class resolution, so no extra dependency is required.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Collision-resistant id with a fallback for browsers without randomUUID. */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Copies text to the clipboard, falling back to the legacy execCommand path
 * when the async Clipboard API is unavailable or blocked (for example inside a
 * sandboxed iframe without clipboard-write permission).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the manual path below.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Word count used for the result panel's metadata line. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Counts markdown level-2 headings — the seven required master-prompt sections. */
export function countSections(text: string): number {
  return (text.match(/^##\s+\S.*$/gm) ?? []).length;
}

/** Removes markdown headings and emphasis markers for card previews. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/[*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncates on a word boundary and appends an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

/** Suggests a library title from the goal: first sentence, trimmed to length. */
export function suggestTitle(goal: string): string {
  const firstSentence = goal.trim().split(/[.\n]/)[0]?.trim() ?? "";
  const base = firstSentence || goal.trim();
  return truncate(base.replace(/[.,;:]+$/, ""), 70);
}

/** Short, locale-aware date for cards. Only ever runs on the client. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Best-guess starting category for a freshly generated prompt. */
export function guessCategory(outputType: OutputType): string {
  switch (outputType) {
    case "Code":
      return "Coding";
    case "Email":
    case "Social media post":
    case "Product description":
      return "Marketing";
    case "Lesson plan":
      return "Education";
    case "Report":
      return "Research";
    case "Article":
    case "Blog post":
    case "Script":
      return "Writing";
    default:
      return "Other";
  }
}

/** Triggers a client-side JSON download. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
