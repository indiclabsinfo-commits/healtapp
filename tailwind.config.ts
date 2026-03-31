import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        // Dark mode colors
        dark: {
          bg: "#0B0C10",
          body: "#050505",
          card: "rgba(255,255,255,0.04)",
          "card-hover": "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.06)",
          nav: "rgba(11,12,16,0.95)",
          input: "rgba(255,255,255,0.04)",
          "input-border": "rgba(255,255,255,0.08)",
          "progress-bg": "rgba(255,255,255,0.06)",
        },
        // Light mode colors
        light: {
          bg: "#FAFBFC",
          body: "#F5F7FA",
          card: "rgba(255,255,255,0.7)",
          border: "rgba(0,0,0,0.06)",
          nav: "rgba(255,255,255,0.95)",
          input: "rgba(0,0,0,0.02)",
          "input-border": "rgba(0,0,0,0.08)",
        },
        // Accent colors
        accent: {
          mint: "#6FFFE9",
          teal: "#5BC0BE",
          "teal-dark": "#0D9488",
          "teal-darker": "#0A7A70",
          red: "#FF6B6B",
          yellow: "#FFD93D",
          purple: "#A78BFA",
          green: "#4ADE80",
        },
        // Text colors
        "text-primary-dark": "#FFFFFF",
        "text-secondary-dark": "rgba(255,255,255,0.6)",
        "text-muted-dark": "rgba(255,255,255,0.35)",
        "text-disabled-dark": "rgba(255,255,255,0.2)",
        "text-primary-light": "#1A1A2E",
        "text-secondary-light": "rgba(0,0,0,0.6)",
        "text-muted-light": "rgba(0,0,0,0.35)",
        // Tag colors
        tag: {
          bg: "rgba(111,255,233,0.1)",
          border: "rgba(111,255,233,0.15)",
          "bg-light": "rgba(13,148,136,0.1)",
          "border-light": "rgba(13,148,136,0.15)",
        },
        // Pill colors
        pill: {
          "active-bg": "rgba(111,255,233,0.12)",
          "active-border": "rgba(111,255,233,0.25)",
          "active-bg-light": "rgba(13,148,136,0.12)",
        },
      },
      borderRadius: {
        card: "16px",
        button: "16px",
        pill: "100px",
        input: "14px",
        icon: "14px",
      },
      spacing: {
        "sidebar-w": "240px",
        "bottom-nav-h": "70px",
        "status-bar-h": "32px",
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        "card-light": "0 1px 8px rgba(0,0,0,0.04)",
        "cta-hover": "0 8px 30px rgba(111,255,233,0.2)",
      },
      backgroundImage: {
        "gradient-cta": "linear-gradient(135deg, #6FFFE9, #5BC0BE)",
        "gradient-cta-light": "linear-gradient(135deg, #0D9488, #0A7A70)",
        "gradient-splash":
          "linear-gradient(160deg, #0B0C10, #0D1117, #0B1A1A)",
        "gradient-splash-light":
          "linear-gradient(160deg, #E6FFFA, #B2F5EA, #81E6D9)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
