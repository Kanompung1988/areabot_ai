/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens — Light Theme ─────────────────────────────
        bg: {
          DEFAULT: "#f5f5f5",   // page background
          card:    "#ffffff",   // card / panel background
          surface: "#f9fafb",   // slightly off-white surface
          border:  "#e5e7eb",   // subtle border colour
        },
        primary: {
          DEFAULT: "#1a1a1a",   // primary action (dark)
          hover:   "#333333",
          dim:     "rgba(26,26,26,0.08)",
          glow:    "rgba(26,26,26,0.15)",
        },
        accent:  "#3b82f6",
        accent2: "#8b5cf6",
        muted:   "#9ca3af",
        text: {
          DEFAULT: "#111827",
          muted:   "#6b7280",
          dim:     "#9ca3af",
        },
      },
      fontFamily: {
        sans:    ["Inter var", "Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow:         "0 0 24px rgba(0,0,0,0.10)",
        "glow-sm":    "0 0 12px rgba(0,0,0,0.06)",
        "glow-lg":    "0 0 60px rgba(0,0,0,0.08)",
        "glow-xl":    "0 0 100px rgba(0,0,0,0.06)",
        card:         "0 4px 20px rgba(0,0,0,0.07)",
        "card-hover": "0 8px 30px rgba(0,0,0,0.11)",
        accent:       "0 0 24px rgba(59,130,246,0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":
          "radial-gradient(ellipse 100% 70% at 50% -10%, rgba(0,0,0,0.04), transparent 70%)",
        "accent-gradient":
          "radial-gradient(ellipse 60% 60% at 80% 60%, rgba(59,130,246,0.06), transparent)",
        "card-gradient":
          "linear-gradient(135deg, rgba(0,0,0,0.02) 0%, transparent 100%)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 50%, transparent 100%)",
      },
      animation: {
        float:           "float 7s ease-in-out infinite",
        "float-slow":    "float 10s ease-in-out infinite",
        "float-fast":    "float 4s ease-in-out infinite",
        "pulse-slow":    "pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":     "spin 16s linear infinite",
        "spin-slower":   "spin 28s linear infinite",
        "spin-reverse":  "spinReverse 20s linear infinite",
        "fade-in":       "fadeIn 0.6s ease-out both",
        "fade-in-up":    "fadeInUp 0.6s ease-out both",
        "slide-up":      "slideUp 0.5s cubic-bezier(0.21,1.02,0.73,1) both",
        "slide-in-right":"slideInRight 0.5s cubic-bezier(0.21,1.02,0.73,1) both",
        "glow-pulse":    "glowPulse 3s ease-in-out infinite",
        shimmer:         "shimmer 2.5s linear infinite",
        orbit:           "orbit 12s linear infinite",
        typewriter:      "typewriter 3s steps(30) forwards",
        beam:            "beam 3s linear infinite",
        "scale-in":      "scaleIn 0.4s cubic-bezier(0.21,1.02,0.73,1) both",
        "blur-in":       "blurIn 0.5s ease-out both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%":      { transform: "translateY(-14px) rotate(1deg)" },
          "66%":      { transform: "translateY(-6px) rotate(-1deg)" },
        },
        spinReverse: {
          from: { transform: "rotate(360deg)" },
          to:   { transform: "rotate(0deg)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(40px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.05)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        orbit: {
          from: { transform: "rotate(0deg) translateX(130px) rotate(0deg)" },
          to:   { transform: "rotate(360deg) translateX(130px) rotate(-360deg)" },
        },
        beam: {
          "0%":   { transform: "translateX(-100%) translateY(-100%) rotate(45deg)", opacity: "0" },
          "50%":  { opacity: "1" },
          "100%": { transform: "translateX(200%) translateY(200%) rotate(45deg)", opacity: "0" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.9)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        blurIn: {
          from: { opacity: "0", filter: "blur(12px)" },
          to:   { opacity: "1", filter: "blur(0)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.21,1.02,0.73,1)",
      },
    },
  },
  plugins: [],
};
