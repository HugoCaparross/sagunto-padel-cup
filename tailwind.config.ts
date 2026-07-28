// Ruta: tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: "#F0443A",
          dark: "#C7362D",
        },
        navy: {
          DEFAULT: "#0D1B2A",
          light: "#16283D",
        },
        sage: {
          DEFAULT: "#A7C4A0",
          dark: "#87A880",
        },
        offwhite: "#E6E6E6",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        card: "1rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;