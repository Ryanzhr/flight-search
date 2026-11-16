import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111c",
          900: "#0b1f33",
          800: "#12304a",
          700: "#1b4263",
        },
        skyline: {
          300: "#7ec8d4",
          400: "#3aafc0",
          500: "#1a9cb0",
          600: "#0f7f90",
        },
        amber: {
          300: "#f0c27a",
          400: "#e2a84a",
          500: "#d4892a",
        },
        mist: "#e8eef3",
        foam: "#f5f8fb",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.85)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out both",
        "rise-delay": "rise 0.9s ease-out 0.12s both",
        "rise-late": "rise 1s ease-out 0.24s both",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
