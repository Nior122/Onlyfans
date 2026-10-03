import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Inter, self-hosted (latin subset, variable weights 100-900).
 *
 * The file lives in app/fonts so builds never depend on a font CDN: no network
 * request at build time, no render-blocking request at runtime, and no layout
 * shift. Inter is licensed under the SIL Open Font License — see
 * app/fonts/INTER-LICENSE.txt.
 */
const inter = localFont({
  src: [{ path: "./fonts/inter-latin-variable.woff2", weight: "100 900", style: "normal" }],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates. The body's own
          attributes are static, so nothing real can be hidden here. */}
      <body className="bg-bg font-sans text-fg" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-solid focus:px-3 focus:py-2 focus:text-body focus:font-medium focus:text-accent-fg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
