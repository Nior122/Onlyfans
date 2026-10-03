import { cn } from "@/lib/utils";

/**
 * Button recipes, in a module without "use client" so server components (the
 * 404 page) can use them too. Client components import these through Button.tsx.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg" | "icon";

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-control " +
  "text-body font-medium transition-colors duration-150 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-solid text-accent-fg hover:bg-accent-solid-hover active:bg-accent-solid-hover",
  secondary: "border border-border bg-transparent text-fg hover:border-border-strong hover:bg-hover",
  ghost: "text-fg-secondary hover:bg-hover hover:text-fg",
};

/* Glyph size sits with the size variant, so an icon button never fights the
   base rule for the other two. */
const SIZES: Record<ButtonSize, string> = {
  md: "h-9 px-3 [&_svg]:size-4",
  lg: "h-10 px-4 [&_svg]:size-4",
  icon: "size-9 [&_svg]:size-[18px]",
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
