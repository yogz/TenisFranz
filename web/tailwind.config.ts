import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#121212",
        surface2: "#1a1a1a",
        border: "#262626",
        text: "#f5f5f5",
        muted: "#a1a1aa",
        lime: {
          DEFAULT: "#ccff00",
          soft: "#ccff0022",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        // prevent iOS Safari auto-zoom by ensuring inputs >= 16px
        "input": ["16px", { lineHeight: "1.25rem" }],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
