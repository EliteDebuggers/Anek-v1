/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-yellow-400', 'text-black', 'bg-error', 'text-white', 'bg-forest-moss'
  ],
  theme: {
    extend: {
      colors: {
        // Dark forest green theme (for Homepage)
        forest: {
          deep: "#0b1f17",
          canvas: "#121412",
          moss: "#4f772d",
          leaf: "#90a955",
          gold: "#c5a059",
          slate: "#1a1c1a",
        },
        // Luminous / Brutalist theme mapping
        primary: "#2d4a3e",
        "on-primary": "#ffffff",
        "primary-container": "#e2f1ea",
        "on-primary-container": "#0b1f17",
        secondary: "#516359",
        "on-secondary": "#ffffff",
        "secondary-container": "#d4e8dd",
        "on-secondary-container": "#0e1f18",
        tertiary: "#3e6374",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#c2e8fb",
        "on-tertiary-container": "#001f2a",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",
        background: "#f4f6f4",
        "on-background": "#191c1b",
        surface: "#f4f6f4",
        "on-surface": "#191c1b",
        "surface-variant": "#dae5df",
        "on-surface-variant": "#3f4944",
        outline: "#6f7974",
        "outline-variant": "#bfc9c3",
        "surface-container-lowest": "#f7f8f6",
        "surface-container-low": "#f2f4f3",
        "surface-container": "#eceee1",
        "surface-container-high": "#e6e9e6",
        "surface-container-highest": "#e1e3e0",
        "inverse-surface": "#2d312e",
        "inverse-on-surface": "#eff1ee",
        "surface-bright": "#f8faf9",
        "surface-dim": "#d8dada"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "xl": "64px",
        "md": "24px",
        "gutter": "20px",
        "margin": "24px",
        "xs": "8px",
        "base": "4px",
        "sm": "16px",
        "lg": "40px"
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Manrope", "sans-serif"],
        mono: ["Space Mono", "monospace"],
        cabin: ["Cabin Sketch", "cursive"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/container-queries'),
  ],
}
