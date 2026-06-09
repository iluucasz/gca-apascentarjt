import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        marca: {
          50: "#eef7f1",
          100: "#d6ecdf",
          200: "#aedcc1",
          300: "#7cc49d",
          400: "#4ba578",
          500: "#2f8a5e",
          600: "#226e4a",
          700: "#1c573c",
          800: "#184631",
          900: "#143a29",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
