import {
  DEFAULT_CATEGORIES,
  OUTPUT_TYPES,
  type OutputType,
  type SavedPrompt,
} from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/utils";

/**
 * Safe, typed access to localStorage.
 *
 * Three failure modes are handled without throwing: storage being unavailable
 * (private mode, blocked cookies), the key being empty, and the stored JSON
 * being corrupted. Every read returns a stable reference when nothing changed,
 * which is what makes the values safe to use with useSyncExternalStore.
 */

/** Stable empty references: returning a fresh array each read would loop React. */
export const EMPTY_PROMPTS: SavedPrompt[] = [];

/**
 * Stable copy of the default categories. Used as the fallback so an empty
 * store still yields the defaults (the fallback bypasses the reviver), and
 * kept reference-stable so useSyncExternalStore does not loop.
 */
const DEFAULT_CATEGORY_LIST: string[] = [...DEFAULT_CATEGORIES];

const MAX_TITLE_LENGTH = 120;

/* ------------------------------ raw access ------------------------------ */

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

let storageAvailable: boolean | null = null;

/** Detects once whether localStorage can be written to at all. */
export function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  if (typeof window === "undefined") return false;
  try {
    const probe = "mpb:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

/* --------------------------- external store core -------------------------- */

type CacheEntry = { raw: string | null; value: unknown };

const cache = new Map<string, CacheEntry>();
const listeners = new Map<string, Set<() => void>>();
let crossTabBound = false;

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

/** Keeps other tabs of the app in sync (the storage event only fires cross-tab). */
function bindCrossTab() {
  if (crossTabBound || typeof window === "undefined") return;
  crossTabBound = true;
  window.addEventListener("storage", (event) => {
    if (!event.key || !listeners.has(event.key)) return;
    cache.delete(event.key);
    notify(event.key);
  });
}

/**
 * Reads and revives a value, memoised on the raw string. `revive` receives
 * already-parsed JSON and must return `fallback` for anything it cannot use.
 */
function readStored<T>(key: string, fallback: T, revive: (raw: unknown) => T): T {
  bindCrossTab();
  const raw = safeGetItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = fallback;
  if (raw !== null) {
    try {
      value = revive(JSON.parse(raw) as unknown);
    } catch {
      // Corrupted JSON: fall back rather than crash.
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function writeStored(key: string, value: unknown): boolean {
  const raw = JSON.stringify(value);
  if (!safeSetItem(key, raw)) return false;
  cache.set(key, { raw, value });
  notify(key);
  return true;
}

function subscribeToKey(key: string, listener: () => void): () => void {
  bindCrossTab();
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(listener);
  listeners.set(key, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
  };
}

/* ------------------------------- revivers -------------------------------- */

function coerceOutputType(value: unknown): OutputType {
  return typeof value === "string" && (OUTPUT_TYPES as readonly string[]).includes(value)
    ? (value as OutputType)
    : "Custom";
}

function toIsoString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

/** Validates one stored record; returns null for anything unusable. */
function coercePrompt(entry: unknown): SavedPrompt | null {
  if (typeof entry !== "object" || entry === null) return null;
  const value = entry as Record<string, unknown>;

  const id = typeof value.id === "string" && value.id.trim() ? value.id.trim() : null;
  const title = typeof value.title === "string" ? value.title.trim().slice(0, MAX_TITLE_LENGTH) : "";
  const promptText = typeof value.promptText === "string" ? value.promptText : "";
  if (!id || !title || !promptText) return null;

  const now = new Date().toISOString();
  const category =
    typeof value.category === "string" && value.category.trim() ? value.category.trim() : "Other";
  const createdAt = toIsoString(value.createdAt, now);

  return {
    id,
    title,
    category,
    role: typeof value.role === "string" ? value.role : "",
    outputType: coerceOutputType(value.outputType),
    goal: typeof value.goal === "string" ? value.goal : "",
    promptText,
    createdAt,
    updatedAt: toIsoString(value.updatedAt, createdAt),
  };
}

/** Drops individual bad records but keeps the good ones. */
export function revivePrompts(raw: unknown): SavedPrompt[] {
  if (!Array.isArray(raw)) return EMPTY_PROMPTS;
  const prompts = raw.flatMap((entry) => {
    const prompt = coercePrompt(entry);
    return prompt ? [prompt] : [];
  });
  return prompts.length > 0 ? prompts : EMPTY_PROMPTS;
}

/** Ensures the default categories always exist, de-duplicated case-insensitively. */
export function reviveCategories(raw: unknown): string[] {
  const names: string[] = [];
  const add = (value: string) => {
    const name = value.trim();
    if (!name) return;
    if (names.some((existing) => existing.toLowerCase() === name.toLowerCase())) return;
    names.push(name);
  };

  if (Array.isArray(raw)) {
    for (const entry of raw) if (typeof entry === "string") add(entry);
  }
  // The defaults are always available, whatever was stored.
  for (const fallback of DEFAULT_CATEGORIES) add(fallback);

  return names;
}

/* ------------------------------ typed stores ------------------------------ */

export const promptsStore = {
  read: () => readStored(STORAGE_KEYS.prompts, EMPTY_PROMPTS, revivePrompts),
  readServer: () => EMPTY_PROMPTS,
  write: (prompts: SavedPrompt[]) => writeStored(STORAGE_KEYS.prompts, prompts),
  subscribe: (listener: () => void) => subscribeToKey(STORAGE_KEYS.prompts, listener),
};

export const categoriesStore = {
  read: () => readStored(STORAGE_KEYS.categories, DEFAULT_CATEGORY_LIST, reviveCategories),
  readServer: () => DEFAULT_CATEGORY_LIST,
  write: (categories: string[]) => writeStored(STORAGE_KEYS.categories, categories),
  subscribe: (listener: () => void) => subscribeToKey(STORAGE_KEYS.categories, listener),
};
