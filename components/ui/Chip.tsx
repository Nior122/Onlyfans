"use client";

import { cn } from "@/lib/utils";

/** Small outlined pill for quick picks. 28px tall, toggleable. */
export function Chip({
  selected = false,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-7 select-none items-center rounded-full border px-3 text-label font-medium",
        "transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-accent bg-accent-subtle text-accent-text"
          : "border-border text-fg-secondary hover:bg-subtle hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}
