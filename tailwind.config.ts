import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./roulette/**/*.{ts,tsx}",
    "./roulette_v1/**/*.{ts,tsx}",
    "./betting-table/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: "#0a5c36",
        gold: "#d4af37",
        roulette: {
          red: "#c0212f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(212,175,55,0.45)",
      },
    },
  },
  plugins: [],
} satisfies Config;
