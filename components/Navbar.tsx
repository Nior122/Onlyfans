"use client";

import { useRef } from "react";
import { Bookmark, Sparkles, Wand2 } from "lucide-react";
import { useLibrary } from "@/components/LibraryProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export type AppView = "builder" | "library";

const TABS: Array<{ id: AppView; label: string; icon: typeof Wand2 }> = [
  { id: "builder", label: "Builder", icon: Wand2 },
  { id: "library", label: "Library", icon: Bookmark },
];

type NavbarProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
};

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
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-fg"
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </span>
          {/* Hidden below sm so the tabs and theme toggle always fit at 360px. */}
          <span className="hidden truncate text-sm font-semibold sm:inline sm:text-base">
            Master Prompt Builder
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Switch between the builder and your library"
            className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1"
          >
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
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
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
                    selected ? "bg-brand text-brand-fg" : "text-muted hover:bg-subtle hover:text-fg",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                  {tab.id === "library" && savedCount > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        selected ? "bg-brand-fg/25" : "bg-subtle",
                      )}
                    >
                      {savedCount}
                      <span className="sr-only"> saved prompts</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
