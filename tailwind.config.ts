import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blaze: {
          orange: "#ff6b35",
          coral: "#ff4757",
          magenta: "#e040fb",
          purple: "#7c3aed",
          violet: "#a855f7",
          pink: "#f72585",
          cyan: "#06b6d4",
          sky: "#0ea5e9",
          gold: "#fbbf24",
        },
        sage: {
          50: "#f6f7f4",
          100: "#e8ebe3",
          200: "#d1d8c8",
          300: "#b3c0a4",
          400: "#94a67f",
          500: "#768b62",
          600: "#5c6e4c",
          700: "#48573d",
          800: "#3c4734",
          900: "#333c2e",
        },
        lavender: {
          50: "#f8f7fc",
          100: "#f0edf8",
          200: "#e2dcf0",
          300: "#cbc0e4",
          400: "#ad9bd3",
          500: "#9178c0",
          600: "#7d5fad",
          700: "#6b4e96",
          800: "#58417b",
          900: "#493766",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "blaze-shift": "blaze-shift 12s ease infinite",
        "blaze-pulse": "blaze-pulse 4s ease-in-out infinite",
      },
      keyframes: {
        "blaze-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "blaze-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
