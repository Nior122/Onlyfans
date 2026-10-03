import { cn } from "@/lib/utils";

/** Bordered surface, 12px radius, no shadow. Border darkens on hover when interactive. */
export function Card({
  padding = "md",
  interactive = false,
  className,
  children,
}: {
  padding?: "none" | "sm" | "md";
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const PADDING = { none: "", sm: "p-4", md: "p-5" } as const;

  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface",
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
