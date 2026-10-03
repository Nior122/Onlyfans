"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, uid } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type ToastItem = { id: string; message: string; variant: ToastVariant };

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

const VISIBLE_MS: Record<ToastVariant, number> = {
  success: 3500,
  info: 3500,
  error: 6000,
};

const MAX_VISIBLE = 4;

/**
 * Bottom-right notifications: small, bordered, with the system's soft shadow,
 * auto-dismissed. Errors interrupt (role="alert"); everything else waits in the
 * polite live region.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = uid();
      setItems((previous) => [...previous, { id, message, variant }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), VISIBLE_MS[variant]),
      );
    },
    [dismiss],
  );

  // Clear pending timers on unmount so nothing fires against a dead tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-stretch gap-2 p-4 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = item.variant === "success" ? Check : item.variant === "error" ? AlertTriangle : Info;

  return (
    <motion.div
      role={item.variant === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border bg-surface p-3 shadow-overlay"
    >
      <Icon
        className={cn(
          "mt-1 size-4 shrink-0",
          item.variant === "error"
            ? "text-error"
            : item.variant === "success"
              ? "text-success"
              : "text-fg-muted",
        )}
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 break-words text-body">{item.message}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1"
      >
        <X aria-hidden="true" />
      </Button>
    </motion.div>
  );
}
