import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        sm: "var(--mp-radius-sm)",
        md: "var(--mp-radius-md)",
        lg: "var(--mp-radius-lg)",
        xl: "var(--mp-radius-xl)",
        "2xl": "calc(var(--mp-radius-xl) + 4px)",
        "3xl": "calc(var(--mp-radius-xl) + 12px)"
      },
      colors: {
        border: "hsl(var(--mp-color-border-default) / <alpha-value>)",
        input: "hsl(var(--mp-color-border-default) / <alpha-value>)",
        ring: "hsl(var(--mp-color-focus-ring) / <alpha-value>)",
        background: "hsl(var(--mp-color-background-base) / <alpha-value>)",
        foreground: "hsl(var(--mp-color-text-primary) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--mp-color-action-primary) / <alpha-value>)",
          foreground: "hsl(var(--mp-color-text-inverse) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "hsl(var(--mp-color-action-secondary) / <alpha-value>)",
          foreground: "hsl(var(--mp-color-text-primary) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "hsl(var(--mp-color-surface-subtle) / <alpha-value>)",
          foreground: "hsl(var(--mp-color-text-tertiary) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "hsl(var(--mp-color-surface-brand-soft) / <alpha-value>)",
          foreground: "hsl(var(--mp-color-text-brand) / <alpha-value>)"
        },
        card: {
          DEFAULT: "hsl(var(--mp-color-surface-default) / <alpha-value>)",
          foreground: "hsl(var(--mp-color-text-primary) / <alpha-value>)"
        },
        info: {
          DEFAULT: "hsl(var(--mp-color-status-info) / <alpha-value>)",
          soft: "hsl(var(--mp-color-status-info-soft) / <alpha-value>)"
        },
        workload: {
          comfortable: "hsl(var(--mp-color-status-comfortable) / <alpha-value>)",
          "comfortable-soft": "hsl(var(--mp-color-status-comfortable-soft) / <alpha-value>)",
          high: "hsl(var(--mp-color-status-high) / <alpha-value>)",
          "high-soft": "hsl(var(--mp-color-status-high-soft) / <alpha-value>)",
          overload: "hsl(var(--mp-color-status-overload) / <alpha-value>)",
          "overload-soft": "hsl(var(--mp-color-status-overload-soft) / <alpha-value>)"
        }
      },
      spacing: {
        0: "var(--mp-space-0)",
        1: "var(--mp-space-1)",
        2: "var(--mp-space-2)",
        3: "var(--mp-space-3)",
        4: "var(--mp-space-4)",
        5: "var(--mp-space-5)",
        6: "var(--mp-space-6)",
        8: "var(--mp-space-8)",
        10: "var(--mp-space-10)",
        12: "var(--mp-space-12)",
        16: "var(--mp-space-16)",
        20: "var(--mp-space-20)",
        24: "var(--mp-space-24)",
        32: "var(--mp-space-32)",
        "card-padding": "var(--mp-space-card-padding)",
        "content-gap": "var(--mp-space-content-gap)",
        "control-x": "var(--mp-space-control-padding-x)",
        "control-y": "var(--mp-space-control-padding-y)",
        "page-padding": "var(--mp-space-page-padding)",
        "section-gap": "var(--mp-space-section-gap)"
      },
      fontFamily: {
        sans: ["var(--mp-font-family-sans)"]
      },
      fontSize: {
        display: [
          "var(--mp-type-display-size)",
          {
            lineHeight: "var(--mp-type-display-line)",
            letterSpacing: "var(--mp-type-display-tracking)",
            fontWeight: "var(--mp-type-display-weight)"
          }
        ],
        h1: [
          "var(--mp-type-h1-size)",
          {
            lineHeight: "var(--mp-type-h1-line)",
            letterSpacing: "var(--mp-type-h1-tracking)",
            fontWeight: "var(--mp-type-h1-weight)"
          }
        ],
        h2: [
          "var(--mp-type-h2-size)",
          {
            lineHeight: "var(--mp-type-h2-line)",
            letterSpacing: "var(--mp-type-h2-tracking)",
            fontWeight: "var(--mp-type-h2-weight)"
          }
        ],
        h3: [
          "var(--mp-type-h3-size)",
          {
            lineHeight: "var(--mp-type-h3-line)",
            letterSpacing: "var(--mp-type-h3-tracking)",
            fontWeight: "var(--mp-type-h3-weight)"
          }
        ],
        title: [
          "var(--mp-type-title-size)",
          {
            lineHeight: "var(--mp-type-title-line)",
            letterSpacing: "var(--mp-type-title-tracking)",
            fontWeight: "var(--mp-type-title-weight)"
          }
        ],
        "body-lg": [
          "var(--mp-type-body-lg-size)",
          {
            lineHeight: "var(--mp-type-body-lg-line)",
            letterSpacing: "var(--mp-type-body-lg-tracking)",
            fontWeight: "var(--mp-type-body-lg-weight)"
          }
        ],
        body: [
          "var(--mp-type-body-size)",
          {
            lineHeight: "var(--mp-type-body-line)",
            letterSpacing: "var(--mp-type-body-tracking)",
            fontWeight: "var(--mp-type-body-weight)"
          }
        ],
        "body-sm": [
          "var(--mp-type-body-sm-size)",
          {
            lineHeight: "var(--mp-type-body-sm-line)",
            letterSpacing: "var(--mp-type-body-sm-tracking)",
            fontWeight: "var(--mp-type-body-sm-weight)"
          }
        ],
        label: [
          "var(--mp-type-label-size)",
          {
            lineHeight: "var(--mp-type-label-line)",
            letterSpacing: "var(--mp-type-label-tracking)",
            fontWeight: "var(--mp-type-label-weight)"
          }
        ],
        caption: [
          "var(--mp-type-caption-size)",
          {
            lineHeight: "var(--mp-type-caption-line)",
            letterSpacing: "var(--mp-type-caption-tracking)",
            fontWeight: "var(--mp-type-caption-weight)"
          }
        ],
        "metric-lg": [
          "var(--mp-type-metric-lg-size)",
          {
            lineHeight: "var(--mp-type-metric-lg-line)",
            letterSpacing: "var(--mp-type-metric-lg-tracking)",
            fontWeight: "var(--mp-type-metric-lg-weight)"
          }
        ],
        "metric-md": [
          "var(--mp-type-metric-md-size)",
          {
            lineHeight: "var(--mp-type-metric-md-line)",
            letterSpacing: "var(--mp-type-metric-md-tracking)",
            fontWeight: "var(--mp-type-metric-md-weight)"
          }
        ]
      },
      boxShadow: {
        calm: "var(--mp-shadow-sm)",
        float: "var(--mp-shadow-md)",
        focus: "var(--mp-shadow-focus)"
      },
      backgroundImage: {
        "calm-grid":
          "linear-gradient(hsl(var(--mp-color-border-default) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--mp-color-border-default) / 0.3) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "40px 40px"
      }
    }
  },
  plugins: []
};

export default config;
