"use client";

import { useState } from "react";
import { Navbar, type AppView } from "@/components/Navbar";
import { BuilderView } from "@/components/BuilderView";
import { LibraryProvider } from "@/components/LibraryProvider";
import { LibraryView } from "@/components/LibraryView";
import { ToastProvider } from "@/components/Toast";

/**
 * Client shell that owns the active view. `app/page.tsx` stays a server
 * component so metadata stays where it belongs.
 */
export function AppShell() {
  const [view, setView] = useState<AppView>("builder");

  return (
    <ToastProvider>
      <LibraryProvider>
        <div className="flex min-h-dvh flex-col">
          <Navbar view={view} onViewChange={setView} />

          <main
            id="main"
            className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-8 sm:px-6 sm:pt-12"
          >
            <section className="mb-8 max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Turn a rough idea into a reusable master prompt.
              </h1>
              <p className="mt-2 text-sm text-muted sm:text-base">
                Describe your goal, pick a role and an output type — you get back a structured,
                role-based prompt with clear steps, rules and a quality checklist. Save it, reuse
                it, or copy it into any AI tool.
              </p>
            </section>

            <div
              role="tabpanel"
              id="panel-builder"
              aria-labelledby="tab-builder"
              hidden={view !== "builder"}
            >
              <BuilderView />
            </div>
            <div
              role="tabpanel"
              id="panel-library"
              aria-labelledby="tab-library"
              hidden={view !== "library"}
            >
              <LibraryView />
            </div>
          </main>

          <footer className="border-t border-line">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>Master Prompt Builder — a portfolio project.</p>
              <p>Your prompts are stored in this browser only.</p>
            </div>
          </footer>
        </div>
      </LibraryProvider>
    </ToastProvider>
  );
}
