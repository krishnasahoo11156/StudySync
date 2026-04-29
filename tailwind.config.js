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

        /* ── Semantic Surfaces ── */
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
        "surface-elevated":       "#FFFFFF",

        /* ── Warm Neutrals ── */
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
        "text-muted":             "#8FA99F",

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
        "border-default":         "#E4EDEA",

        /* ── Inverse ── */
        "inverse-primary":        "#86EFAC",

        /* ── Secondary ── */
        "secondary":              "#16A34A",
        "on-secondary":           "#FFFFFF",
        "secondary-container":    "#DCFCE7",
        "on-secondary-container": "#14532D",

        /* ── Focus Mode ── */
        "focus-deep":             "#0D1F1A",
        "focus-teal":             "#0A1A2E",
        "focus-glow":             "#4ADE80",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', "sans-serif"],
        body:     ['"Plus Jakarta Sans"', "sans-serif"],
        label:    ['"Plus Jakarta Sans"', "sans-serif"],
      },
      fontSize: {
        "display": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "h1":      ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "h2":      ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        "body-lg": ["0.9375rem", { lineHeight: "1.65", fontWeight: "400" }],
        "caption": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "700" }],
      },
      boxShadow: {
        /* 3-tier elevation */
        "flat":     "none",
        "raised":   "0 1px 3px rgba(22, 163, 74, 0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "floating": "0 8px 28px rgba(22, 163, 74, 0.1), 0 2px 8px rgba(0,0,0,0.04)",
        /* Utilities */
        "card":     "0 2px 12px rgba(22, 163, 74, 0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "modal":    "0 25px 60px rgba(22, 163, 74, 0.12), 0 8px 24px rgba(0,0,0,0.08)",
        "btn":      "0 4px 12px rgba(22, 163, 74, 0.25)",
        "accent":   "0 4px 12px rgba(96, 165, 250, 0.25)",
        "glow-green": "0 0 0 3px rgba(74,222,128,0.2)",
        "glow-blue":  "0 0 0 3px rgba(96,165,250,0.2)",
        "inner-soft": "inset 0 2px 4px rgba(22, 163, 74, 0.06)",
      },
      spacing: {
        "sidebar-collapsed": "64px",
        "sidebar-expanded":  "220px",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "page-enter": {
          "from": { opacity: "0", transform: "translateY(8px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "from": { opacity: "0", transform: "translateY(10px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "from": { opacity: "0", transform: "translateY(20px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "from": { opacity: "0", transform: "scale(0.95)" },
          "to":   { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          "from": { opacity: "0", transform: "translateY(8px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "from": { opacity: "0", transform: "translateY(16px) scale(0.95)" },
          "to":   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "check-draw": {
          "from": { strokeDashoffset: "24" },
          "to":   { strokeDashoffset: "0" },
        },
        "particle-burst": {
          "0%":   { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "focus-bg": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%":      { transform: "translate(30px, -20px)" },
          "50%":      { transform: "translate(-10px, 30px)" },
          "75%":      { transform: "translate(-30px, -10px)" },
        },
        "strikethrough": {
          "from": { width: "0%" },
          "to":   { width: "100%" },
        },
      },
      animation: {
        "page-enter":    "page-enter 180ms ease-out both",
        "fade-in":       "fade-in 0.4s ease-out both",
        "slide-up":      "slide-up 0.5s ease-out both",
        "scale-in":      "scale-in 0.3s ease-out both",
        "shimmer":       "shimmer 1.5s ease-in-out infinite",
        "toast-in":      "toast-in 350ms cubic-bezier(0.34,1.56,0.64,1) both",
        "check-draw":    "check-draw 200ms ease-out forwards",
        "particle-burst": "particle-burst 300ms ease-out forwards",
        "focus-bg":      "focus-bg 5s ease-in-out infinite",
        "orb-drift":     "orb-drift 8s ease-in-out infinite",
        "strikethrough": "strikethrough 300ms ease-out forwards",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
