"use client";

import { useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Navbar, type AppView } from "@/components/Navbar";
import { BuilderView } from "@/components/BuilderView";
import { LibraryProvider } from "@/components/LibraryProvider";
import { LibraryView } from "@/components/LibraryView";
import { Container } from "@/components/ui/Container";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Client shell that owns the active view. `app/page.tsx` stays a server
 * component so metadata stays where it belongs.
 *
 * Every band of the page — navbar, main, footer — puts its content in the same
 * Container, which is what keeps the logo, the page title and the form card on
 * one left edge.
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

            <main id="main" className="flex-1">
              <Container className="pb-16 pt-12">
                <section className="mb-8">
                  <h1 className="text-title font-semibold">Turn a goal into a master prompt</h1>
                  <p className="mt-2 max-w-intro text-lead text-fg-secondary">
                    Describe what you need, pick a role and an output type — you get a structured
                    prompt ready to paste anywhere.
                  </p>
                </section>

                <ViewPanel id="builder" active={view === "builder"} panelRef={builderRef}>
                  <BuilderView />
                </ViewPanel>

                <ViewPanel id="library" active={view === "library"} panelRef={libraryRef}>
                  <LibraryView onNavigateToBuilder={() => setView("builder")} />
                </ViewPanel>
              </Container>
            </main>

            <footer className="border-t border-border">
              <Container className="flex flex-col gap-1 py-6 text-label text-fg-muted sm:flex-row sm:items-center sm:justify-between">
                <p>Master Prompt Builder — a portfolio project.</p>
                <p>Your prompts are stored in this browser only.</p>
              </Container>
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
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
