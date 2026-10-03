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
