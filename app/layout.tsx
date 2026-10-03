import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Master Prompt Builder",
    template: "%s | Master Prompt Builder",
  },
  description:
    "Turn a goal, a role and an output type into a structured, role-based master prompt you can reuse anywhere.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#080a11" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the saved theme before first paint so the page never flashes the
 * wrong colours. Runs inline (blocking) on purpose and fails silently if
 * localStorage is unavailable.
 */
const themeInitScript = `(function(){try{var s=localStorage.getItem("mpb:theme");var dark=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",dark);r.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates. The body's own
          attributes are static, so nothing real can be hidden here. */}
      <body className="min-h-dvh font-sans" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-fg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
