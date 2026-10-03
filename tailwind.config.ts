import type { Config } from "tailwindcss";

/**
 * Every value here maps to a CSS variable declared in app/globals.css, so both
 * themes are driven by one set of names. Add colours as tokens first, never as
 * literal hex values in components.
 *
 * `legacy` keys (line, muted, brand, danger, and the shadow names) exist only
 * so components can be migrated phase by phase; they are removed in phase 6.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        hover: "rgb(var(--hover) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",

        /* Text */
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          secondary: "rgb(var(--fg-secondary) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
          placeholder: "rgb(var(--fg-placeholder) / <alpha-value>)",
        },

        /* The single accent */
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          text: "rgb(var(--accent-text) / <alpha-value>)",
          solid: "rgb(var(--accent-solid) / <alpha-value>)",
          "solid-hover": "rgb(var(--accent-solid-hover) / <alpha-value>)",
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
          subtle: "rgb(var(--accent-subtle) / <alpha-value>)",
        },

        /* Category dots — the only non-accent colour in the UI */
        "dot-indigo": "rgb(var(--dot-indigo) / <alpha-value>)",
        "dot-emerald": "rgb(var(--dot-emerald) / <alpha-value>)",
        "dot-amber": "rgb(var(--dot-amber) / <alpha-value>)",
        "dot-rose": "rgb(var(--dot-rose) / <alpha-value>)",
        "dot-sky": "rgb(var(--dot-sky) / <alpha-value>)",
        "dot-violet": "rgb(var(--dot-violet) / <alpha-value>)",

        /* Status, used sparingly */
        success: "rgb(var(--success) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        "error-solid": "rgb(var(--error-solid) / <alpha-value>)",
        "error-solid-fg": "rgb(var(--error-solid-fg) / <alpha-value>)",
      },

      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },

      /* Type scale: tight headings, 15px page description, 1.6 body, 13px form labels, 12px meta. */
      fontSize: {
        title: ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        lead: ["15px", { lineHeight: "1.6" }],
        section: ["18px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.6" }],
        field: ["13px", { lineHeight: "1.4" }],
        label: ["12px", { lineHeight: "1.4" }],
      },

      lineHeight: {
        prompt: "1.7",
      },

      /* Control heights that are not on the 8px spacing scale. */
      height: {
        chip: "30px",
        cta: "44px",
      },

      /* Focus ring: 3px soft accent wash on a control that has focus. */
      ringWidth: {
        focus: "3px",
      },

      /* Three radii: controls, cards, pills. */
      borderRadius: {
        control: "8px",
        card: "12px",
      },

      maxWidth: {
        container: "1100px",
        /* Page description: one comfortable read, capped at 640px. */
        intro: "640px",
        /* ~70 characters at 14px, for prompt text. */
        prose: "70ch",
      },

      /* One soft shadow, floating elements only. */
      boxShadow: {
        overlay: "var(--shadow-overlay)",
      },

      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
