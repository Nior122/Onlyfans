"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/utils";

type Theme = "light" | "dark";

/**
 * The `dark` class on <html> is the single source of truth. It is applied
 * before first paint by the inline script in app/layout.tsx, so this component
 * only has to observe it rather than keep a second copy in React state.
 */
function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** The server has no DOM, so hydration always starts from light. */
function getServerSnapshot(): Theme {
  return "light";
}

function storedTheme(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.theme);
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function subscribe(onChange: () => void): () => void {
  // The class attribute changing (from any source) means the theme changed.
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // Follow the OS setting, but only while the user has not chosen explicitly.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = (event: MediaQueryListEvent) => {
    const stored = storedTheme();
    if (stored === "light" || stored === "dark") return;
    applyTheme(event.matches ? "dark" : "light");
  };
  media.addEventListener("change", onMediaChange);

  // Keep other tabs of this app in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEYS.theme) return;
    const stored = storedTheme();
    if (stored === "light" || stored === "dark") applyTheme(stored);
  };
  window.addEventListener("storage", onStorage);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMediaChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = useCallback(() => {
    const target: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(target);
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, target);
    } catch {
      // Private mode or blocked storage: the toggle still works for this session.
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-secondary !px-2.5"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
