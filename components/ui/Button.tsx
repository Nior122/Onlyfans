"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The only button in the system.
 *
 * Three variants (primary, secondary, ghost) and three heights: 36px by
 * default, 40px for a screen's main action, and icon buttons that grow to 40px
 * on touch screens. Icon sizing is enforced here so every button in the app
 * aligns the same way (16px, 1.75 stroke via the global .lucide rule).
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg" | "icon";

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-control " +
  "transition-colors duration-150 [&_svg]:size-4 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-solid text-accent-fg hover:bg-accent-solid-hover active:bg-accent-solid-hover",
  secondary: "border border-border bg-transparent text-fg hover:border-border-strong hover:bg-subtle",
  ghost: "text-fg-secondary hover:bg-subtle hover:text-fg",
};

const SIZES: Record<ButtonSize, string> = {
  md: "h-9 px-3 text-body",
  lg: "h-10 px-4 text-body",
  /* 40px on touch screens, 36px with a pointer. */
  icon: "h-10 w-10 sm:h-9 sm:w-9",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass({ variant, size, className })} {...props} />
  );
});
