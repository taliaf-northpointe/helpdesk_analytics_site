import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Northpointe brand palette — driven by CSS variables for theme switching
        brand: {
          primary:           "rgb(var(--brand-primary)   / <alpha-value>)",
          secondary:         "rgb(var(--brand-secondary) / <alpha-value>)",
          accent:            "rgb(var(--brand-accent)    / <alpha-value>)",
          "primary-light":   "rgb(var(--brand-primary-light)   / <alpha-value>)",
          "primary-dark":    "rgb(var(--brand-primary-dark)    / <alpha-value>)",
          "secondary-light": "rgb(var(--brand-secondary-light) / <alpha-value>)",
          "secondary-dark":  "rgb(var(--brand-secondary-dark)  / <alpha-value>)",
          "accent-light":    "rgb(var(--brand-accent-light)    / <alpha-value>)",
          "accent-dark":     "rgb(var(--brand-accent-dark)     / <alpha-value>)",
        },
        // shadcn/ui semantic tokens (CSS variable–driven)
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Status colors
        status: {
          open:       "#3B82F6",
          inprogress: "#F59E0B",
          resolved:   "#10B981",
          closed:     "#6B7280",
          breach:     "#EF4444",
        },
        blush: "#ffebef",
      },
      fontFamily: {
        sans: ["Inter", "var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200px 0" },
          to:   { backgroundPosition: "calc(200px + 100%) 0" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.4s ease-out",
        "slide-in-right":  "slide-in-right 0.3s ease-out",
        shimmer:           "shimmer 2s infinite linear",
      },
      backgroundImage: {
        "gradient-brand":  "linear-gradient(135deg, rgb(var(--brand-primary)) 0%, rgb(var(--brand-secondary)) 100%)",
        "gradient-accent": "linear-gradient(135deg, rgb(var(--brand-accent)) 0%, rgb(var(--brand-accent-light)) 100%)",
      },
      boxShadow: {
        card:      "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-lg": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        glass:     "0 8px 32px 0 rgb(var(--brand-primary) / 0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
