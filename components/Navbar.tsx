"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useLibrary } from "@/components/LibraryProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export type AppView = "builder" | "library";

const TABS: Array<{ id: AppView; label: string }> = [
  { id: "builder", label: "Builder" },
  { id: "library", label: "Library" },
];

type NavbarProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
};

/**
 * Slim 56px bar: mark and app name, tabs with an accent underline for the
 * active view, theme toggle on the right. Bottom border only, no shadow.
 */
export function Navbar({ view, onViewChange }: NavbarProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { prompts, ready } = useLibrary();
  const savedCount = ready ? prompts.length : 0;

  /** Left/Right arrows move between tabs, as expected of a tablist. */
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + offset + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex];
    if (!nextTab) return;
    onViewChange(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="mx-auto flex h-14 w-full max-w-container items-center gap-6 px-6 sm:px-8">
        <span className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-control bg-accent-solid text-label text-accent-fg"
          >
            M
          </span>
          <span className="hidden text-body font-semibold sm:inline">Master Prompt Builder</span>
        </span>

        <nav
          role="tablist"
          aria-label="Switch between the builder and your library"
          className="flex h-14 items-stretch gap-6"
        >
          {TABS.map((tab, index) => {
            const selected = view === tab.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onViewChange(tab.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "relative flex items-center gap-2 text-body transition-colors duration-150",
                  selected ? "text-fg" : "text-fg-secondary hover:text-fg",
                )}
              >
                {tab.label}
                {tab.id === "library" && savedCount > 0 ? (
                  <span className="text-label text-fg-muted">
                    {savedCount}
                    <span className="sr-only"> saved prompts</span>
                  </span>
                ) : null}
                {selected ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
