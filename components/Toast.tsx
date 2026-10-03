"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon =
    item.variant === "success" ? CheckCircle2 : item.variant === "error" ? AlertTriangle : Info;

  return (
    <div
      // Errors interrupt; everything else waits its turn in the live region.
      role={item.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-3 shadow-pop animate-toast-in",
        item.variant === "error" ? "border-danger/40" : "border-line",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          item.variant === "error"
            ? "text-danger"
            : item.variant === "success"
              ? "text-brand"
              : "text-muted",
        )}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 text-muted transition-colors hover:bg-subtle hover:text-fg"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
