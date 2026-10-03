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

        /* Status, used sparingly */
        success: "rgb(var(--success) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",

        /* --- transitional aliases (phase 6 removes this block) --- */
        line: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--fg-secondary) / <alpha-value>)",
        danger: "rgb(var(--error) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          strong: "rgb(var(--accent-solid-hover) / <alpha-value>)",
          soft: "rgb(var(--accent-subtle) / <alpha-value>)",
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
        },
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

      /* Type scale: four sizes, tight headings, 1.6 body. */
      fontSize: {
        title: ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        section: ["18px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.6" }],
        label: ["12px", { lineHeight: "1.4" }],
      },

      lineHeight: {
        prompt: "1.7",
      },

      /* Three radii: controls, cards, pills. */
      borderRadius: {
        control: "8px",
        card: "12px",
      },

      maxWidth: {
        container: "1100px",
        /* ~70 characters at 14px, for prompt text. */
        prose: "70ch",
      },

      /* One soft shadow, floating elements only. */
      boxShadow: {
        overlay: "var(--shadow-overlay)",
        pop: "var(--shadow-overlay)", // transitional alias
      },

      transitionDuration: {
        DEFAULT: "150ms",
      },

      /*
       * Transitional: the advanced-options panel still uses animate-fade-up.
       * Retimed to the design system's 150ms / 4px so it matches the spec, and
       * removed in phase 6 when that panel becomes a motion element.
       */
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 150ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
