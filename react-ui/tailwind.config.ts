import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem"
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      boxShadow: {
        calm: "0 24px 60px rgba(42, 77, 52, 0.08)",
        float: "0 12px 36px rgba(44, 89, 57, 0.12)"
      },
      backgroundImage: {
        "calm-grid":
          "linear-gradient(rgba(95, 133, 108, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(95, 133, 108, 0.06) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "40px 40px"
      }
    }
  },
  plugins: []
};

export default config;
