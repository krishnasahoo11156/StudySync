/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Primary Green ── */
        "primary":                "#16A34A",
        "primary-dark":           "#15803D",
        "primary-light":          "#22C55E",
        "primary-container":      "#DCFCE7",
        "on-primary":             "#FFFFFF",
        "on-primary-container":   "#14532D",

        /* ── Backgrounds ── */
        "surface":                "#F8FAF9",
        "surface-bright":         "#F8FAF9",
        "background":             "#F8FAF9",
        "surface-container-low":  "#F1F5F4",
        "surface-container":      "#EBF0EE",
        "surface-container-high": "#E1ECEA",
        "surface-container-highest": "#D4E4DF",
        "surface-container-lowest":  "#FFFFFF",
        "surface-dim":            "#C9D8D3",
        "surface-variant":        "#E4EDEA",
        "surface-tint":           "#16A34A",

        /* ── Support / Warm Neutrals ── */
        "sand":                   "#F5F1E8",
        "sand-dark":              "#EDE7D4",
        "stone":                  "#D6C7AE",
        "stone-dark":             "#B8A68A",

        /* ── On Surface ── */
        "on-surface":             "#1A2621",
        "on-surface-variant":     "#3D524A",
        "on-background":          "#1A2621",
        "inverse-surface":        "#2D3D38",
        "inverse-on-surface":     "#ECF4F0",

        /* ── Accent Blue ── */
        "accent":                 "#60A5FA",
        "accent-dark":            "#3B82F6",
        "accent-container":       "#DBEAFE",
        "on-accent":              "#1E3A5F",

        /* ── Alerts ── */
        "error":                  "#F87171",
        "error-dark":             "#EF4444",
        "error-container":        "#FEE2E2",
        "on-error-container":     "#7F1D1D",
        "warning":                "#FACC15",
        "warning-dark":           "#EAB308",
        "warning-container":      "#FEF9C3",
        "tertiary":               "#F87171",
        "tertiary-container":     "#FEE2E2",
        "on-tertiary":            "#FFFFFF",
        "on-tertiary-container":  "#7F1D1D",

        /* ── Outline ── */
        "outline":                "#8FA99F",
        "outline-variant":        "#C2D4CE",

        /* ── Inverse ── */
        "inverse-primary":        "#86EFAC",

        /* ── Secondary (for analytics compat) ── */
        "secondary":              "#16A34A",
        "on-secondary":           "#FFFFFF",
        "secondary-container":    "#DCFCE7",
        "on-secondary-container": "#14532D",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', "sans-serif"],
        body:     ['"Plus Jakarta Sans"', "sans-serif"],
        label:    ['"Plus Jakarta Sans"', "sans-serif"],
      },
      boxShadow: {
        "card":   "0 2px 12px rgba(22, 163, 74, 0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "modal":  "0 25px 60px rgba(22, 163, 74, 0.12), 0 8px 24px rgba(0,0,0,0.08)",
        "btn":    "0 4px 12px rgba(22, 163, 74, 0.25)",
        "accent": "0 4px 12px rgba(96, 165, 250, 0.25)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
