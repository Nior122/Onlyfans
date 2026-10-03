import { cn } from "@/lib/utils";

/**
 * Neutral badge with a small coloured dot, used for categories.
 *
 * The dot is decorative: the category name is always present as text, so the
 * dot never carries meaning on its own. Six mid-tone hues read on both themes,
 * and custom categories get a deterministic hue so a category looks the same
 * everywhere.
 */

export type DotHue =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "neutral";

const DOT_CLASS: Record<DotHue, string> = {
  indigo: "bg-dot-indigo",
  emerald: "bg-dot-emerald",
  amber: "bg-dot-amber",
  rose: "bg-dot-rose",
  sky: "bg-dot-sky",
  violet: "bg-dot-violet",
  neutral: "bg-fg-placeholder",
};

/** Fixed hues for the default categories; "Other" stays neutral. */
const KNOWN_HUES: Record<string, DotHue> = {
  writing: "indigo",
  coding: "sky",
  marketing: "rose",
  business: "amber",
  education: "emerald",
  research: "violet",
  other: "neutral",
};

const FALLBACK_ORDER: DotHue[] = ["indigo", "emerald", "amber", "rose", "sky", "violet"];

export function categoryHue(category: string): DotHue {
  const known = KNOWN_HUES[category.trim().toLowerCase()];
  if (known) return known;

  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return FALLBACK_ORDER[hash % FALLBACK_ORDER.length] ?? "neutral";
}

export function Badge({
  children,
  dot,
  className,
}: {
  children: React.ReactNode;
  dot?: DotHue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-2 rounded-full border border-border bg-subtle px-2",
        "text-label font-medium text-fg-secondary",
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[dot])} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
