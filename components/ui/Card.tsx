import { cn } from "@/lib/utils";

/** Bordered surface, 12px radius, no shadow. Border darkens on hover when interactive. */
export function Card({
  padding = "md",
  tone = "surface",
  interactive = false,
  className,
  children,
}: {
  padding?: "none" | "md" | "lg";
  /** `surface` for cards that hold content, `page` for a card that is a form. */
  tone?: "surface" | "page";
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const PADDING = { none: "", md: "p-5", lg: "p-6" } as const;
  const TONE = { surface: "bg-surface", page: "bg-bg" } as const;

  return (
    <div
      className={cn(
        "rounded-card border border-border",
        TONE[tone],
        PADDING[padding],
        interactive && "transition-colors duration-150 hover:border-border-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Loading placeholder. The pulse is disabled under prefers-reduced-motion. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span style={style} className={cn("block animate-pulse rounded-control bg-subtle", className)} />;
}
