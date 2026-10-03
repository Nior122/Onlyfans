"use client";

import { useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Navbar, type AppView } from "@/components/Navbar";
import { BuilderView } from "@/components/BuilderView";
import { LibraryProvider } from "@/components/LibraryProvider";
import { LibraryView } from "@/components/LibraryView";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Client shell that owns the active view. `app/page.tsx` stays a server
 * component so metadata stays where it belongs.
 *
 * MotionConfig reducedMotion="user" makes every Framer Motion animation in the
 * tree respect the visitor's OS "reduce motion" setting.
 */
export function AppShell() {
  const [view, setView] = useState<AppView>("builder");
  const builderRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Move focus into the newly revealed panel, but not on first paint.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const target = view === "builder" ? builderRef.current : libraryRef.current;
    target?.focus();
  }, [view]);

  return (
    <MotionConfig reducedMotion="user">
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

              <ViewPanel
                id="builder"
                active={view === "builder"}
                panelRef={builderRef}
              >
                <BuilderView />
              </ViewPanel>

              <ViewPanel
                id="library"
                active={view === "library"}
                panelRef={libraryRef}
              >
                <LibraryView />
              </ViewPanel>
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
    </MotionConfig>
  );
}

type ViewPanelProps = {
  id: AppView;
  active: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

/**
 * A tab panel. The outer element keeps the ARIA wiring and the `hidden`
 * attribute; the inner motion element fades its contents in when the tab is
 * revealed (it animates back to hidden, which is invisible either way).
 */
function ViewPanel({ id, active, panelRef, children }: ViewPanelProps) {
  return (
    <div
      ref={panelRef}
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!active}
      tabIndex={-1}
    >
      <motion.div
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
