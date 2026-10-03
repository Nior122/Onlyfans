import { cn } from "@/lib/utils";

/**
 * The single page gutter. Every full-width band (navbar, main, footer) wraps its
 * content in this, so the logo, the page title and the form card all start on
 * the same left edge.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-container px-6 sm:px-8", className)}>{children}</div>
  );
}
